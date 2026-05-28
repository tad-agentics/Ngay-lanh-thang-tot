import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { BackBar, Mono } from "~/components/brand";
import { CConfirmDialog } from "~/components/direction-c/CConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useLaSoRecomputeGate } from "~/hooks/useLaSoRecomputeGate";
import { useProfile } from "~/hooks/useProfile";
import { useSavedPicks } from "~/hooks/useSavedPicks";
import {
  BAT_TU_BIRTH_TIME_OPTIONS,
  ddMmYyyyInputToBatTuBirthDate,
  ddMmYyyyInputToIsoDate,
  formatDdMmYyyyWithAutoSlash,
  gioiTinhToBatTuGender,
  gioSinhToBatTuBirthTime,
  isoYmdToDdMmYyyyInput,
} from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import {
  birthEditLimitReached,
  birthEditsRemaining,
} from "~/lib/birth-edit-limit";
import { CT } from "~/lib/c-tokens";
import { downloadUserDataJson } from "~/lib/export-user-data";
import { clearUserReadingSessionCaches } from "~/lib/la-so-recompute-invalidate";
import type { Profile } from "~/lib/profile-context";
import { supabase } from "~/lib/supabase";

const UNSET = "__unset__";

const DELETE_ACCOUNT_EMAIL =
  "mailto:privacy@ngaylanhthangtot.vn?subject=Y%C3%AAu%20c%E1%BA%A7u%20xo%C3%A1%20t%C3%A0i%20kho%E1%BA%A3n";

function birthDataChanged(
  profile: Profile,
  ngaySinh: string,
  birthTimeCode: string,
  gioiTinh: "" | "nam" | "nu",
): boolean {
  const iso = ddMmYyyyInputToIsoDate(ngaySinh.trim());
  const profileIso = profile.ngay_sinh?.slice(0, 10) ?? null;
  if (iso !== profileIso) return true;
  if (gioiTinh !== (profile.gioi_tinh ?? "")) return true;

  const profileCode = gioSinhToBatTuBirthTime(profile.gio_sinh);
  const nextCode =
    birthTimeCode === UNSET ? undefined : Number.parseInt(birthTimeCode, 10);
  return profileCode !== nextCode;
}

export function CEditProfileScreen() {
  const navigate = useNavigate();
  const { profile, loading, reload } = useProfile();
  const { picks } = useSavedPicks();
  const [displayName, setDisplayName] = useState("");
  const [ngaySinh, setNgaySinh] = useState("");
  const [birthTimeCode, setBirthTimeCode] = useState(UNSET);
  const [gioiTinh, setGioiTinh] = useState<"" | "nam" | "nu">("");
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!profile || loading) return;
    setDisplayName(profile.display_name ?? "");
    setNgaySinh(isoYmdToDdMmYyyyInput(profile.ngay_sinh));
    const code = gioSinhToBatTuBirthTime(profile.gio_sinh);
    setBirthTimeCode(code !== undefined ? String(code) : UNSET);
    setGioiTinh(profile.gioi_tinh ?? "");
  }, [profile, loading]);

  const { pending: recomputePending, failed: recomputeFailed } =
    useLaSoRecomputeGate({
      onReady: () => {
        toast.success("Lá số đã chấm lại xong.");
      },
      onFailed: () => {
        toast.error("Chấm lại lá số thất bại — thử lưu lại hoặc liên hệ hỗ trợ.");
      },
    });

  const editsLeft = useMemo(
    () => (profile ? birthEditsRemaining(profile) : 2),
    [profile],
  );
  const atBirthLimit = profile ? birthEditLimitReached(profile) : false;

  async function handleSave() {
    if (!profile) return;
    const nameTrim = displayName.trim();
    const nameChanged = nameTrim !== (profile.display_name ?? "").trim();
    const birthChanged = birthDataChanged(
      profile,
      ngaySinh,
      birthTimeCode,
      gioiTinh,
    );

    if (!nameChanged && !birthChanged) {
      toast.message("Không có thay đổi.");
      return;
    }

    if (birthChanged) {
      if (atBirthLimit) {
        toast.error("Liên hệ hỗ trợ nếu cần sửa thêm.");
        return;
      }
      const birth_date = ddMmYyyyInputToBatTuBirthDate(ngaySinh.trim());
      if (!birth_date) {
        toast.error("Ngày sinh cần đúng DD/MM/YYYY.");
        return;
      }
      if (!gioiTinh) {
        toast.error("Chọn giới tính.");
        return;
      }
    }

    setSaving(true);

    if (nameChanged) {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: nameTrim || null })
        .eq("id", profile.id);
      if (error) {
        setSaving(false);
        toast.error(error.message);
        return;
      }
    }

    if (birthChanged) {
      const body: Record<string, unknown> = {
        birth_date: ddMmYyyyInputToBatTuBirthDate(ngaySinh.trim()),
        gender: gioiTinhToBatTuGender(gioiTinh as "nam" | "nu"),
        tz: "Asia/Ho_Chi_Minh",
      };
      if (birthTimeCode !== UNSET) {
        body.birth_time = Number(birthTimeCode);
      }

      const res = await invokeBatTu<unknown>({ op: "recompute-la-so", body });
      if (!res.ok) {
        setSaving(false);
        if (res.code === "BIRTH_EDIT_LIMIT") {
          toast.error("Liên hệ hỗ trợ nếu cần sửa thêm.");
        } else {
          toast.error(res.message ?? "Không cập nhật lá số được.");
        }
        if (nameChanged) {
          await reload();
          window.dispatchEvent(new Event("ngaytot:profile-refresh"));
        }
        return;
      }
      clearUserReadingSessionCaches(profile.id);
    }

    setSaving(false);
    await reload();
    window.dispatchEvent(new Event("ngaytot:profile-refresh"));
    toast.success(
      birthChanged
        ? "Đã cập nhật hồ sơ — đang chấm lại lá số."
        : "Đã cập nhật tên hiển thị.",
    );
    navigate("/toi", { replace: true });
  }

  function handleExportData() {
    if (!profile || exporting) return;
    setExporting(true);
    try {
      downloadUserDataJson(profile, picks);
      toast.success("Đã tải file JSON.");
    } catch {
      toast.error("Không tải được dữ liệu.");
    } finally {
      setExporting(false);
    }
  }

  function confirmDeleteAccount() {
    setDeleteOpen(false);
    window.location.href = DELETE_ACCOUNT_EMAIL;
  }

  if (loading || !profile) {
    return (
      <div className="min-h-full bg-paper px-6 py-10 font-serif text-ink-2">
        Đang tải…
      </div>
    );
  }

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <BackBar
        title="Sửa hồ sơ"
        endAdornment={
          <button
            type="button"
            disabled={saving || recomputePending}
            onClick={() => void handleSave()}
            className="cursor-pointer border-none bg-transparent p-0 font-serif text-[12.5px] disabled:opacity-50"
            style={{ color: CT.goldDeep }}
          >
            {saving ? "Đang lưu…" : "Lưu"}
          </button>
        }
      />

      <div className="flex-1 overflow-auto px-7 pb-10 pt-3">
        <p className="m-0 text-[13px] leading-snug" style={{ color: CT.muted }}>
          Sửa lá số sẽ chấm lại tất cả ngày trong lịch của bạn. Cẩn thận với giờ sinh — sai
          một canh, sai cả luận đoán.
        </p>
        <p className="mt-2 text-[12px]" style={{ color: CT.ink2 }}>
          Còn {editsLeft} lần sửa ngày/giờ sinh trong 30 ngày.
        </p>

        <div className="mt-5 flex flex-col gap-[18px]">
          <label className="block">
            <span className="text-[11.5px]" style={{ color: CT.muted }}>
              Họ và tên
            </span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full border-0 border-b bg-transparent pb-1.5 pt-1 font-[family-name:var(--font-display-2)] text-[17px] font-semibold tracking-[-0.005em] outline-none"
              style={{ borderColor: CT.hairline, color: CT.ink }}
            />
          </label>

          <div>
            <span className="text-[11.5px]" style={{ color: CT.muted }}>
              Giới tính
            </span>
            <div className="mt-2 text-sm">
              {(["nam", "nu"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGioiTinh(g)}
                  className="mr-2 cursor-pointer border-none bg-transparent p-0 font-serif"
                  style={{
                    color: CT.ink,
                    fontWeight: gioiTinh === g ? 600 : 400,
                    borderBottom:
                      gioiTinh === g ? `1.5px solid ${CT.goldDeep}` : "none",
                  }}
                >
                  {g === "nam" ? "Nam" : "Nữ"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11.5px]" style={{ color: CT.muted }}>
              Email
            </span>
            <div
              className="mt-2 flex items-baseline gap-1.5 border-b pb-1.5"
              style={{ borderColor: CT.hairline }}
            >
              <span className="font-[family-name:var(--font-display-2)] text-[17px] font-semibold text-ink-2">
                {profile.email ?? "—"}
              </span>
              <Mono className="ml-auto text-[9px]" style={{ color: CT.muted }}>
                khoá
              </Mono>
            </div>
          </div>

          <label className="block">
            <span className="text-[11.5px]" style={{ color: CT.muted }}>
              Ngày sinh dương lịch
            </span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="DD/MM/YYYY"
              value={ngaySinh}
              onChange={(e) =>
                setNgaySinh(formatDdMmYyyyWithAutoSlash(e.target.value))
              }
              disabled={atBirthLimit}
              className="mt-1 w-full border-0 border-b bg-transparent pb-1.5 pt-1 font-[family-name:var(--font-display-2)] text-[17px] font-semibold tracking-[-0.005em] outline-none disabled:opacity-60"
              style={{ borderColor: CT.goldDeep, color: CT.ink }}
            />
          </label>

          <div>
            <span className="text-[11.5px]" style={{ color: CT.muted }}>
              Giờ sinh — 12 canh
            </span>
            <Select
              value={birthTimeCode}
              onValueChange={setBirthTimeCode}
              disabled={atBirthLimit}
            >
              <SelectTrigger
                className="mt-1 h-auto border-0 border-b bg-transparent px-0 pb-1.5 shadow-none disabled:opacity-60"
                style={{ borderColor: CT.hairline }}
              >
                <SelectValue placeholder="Chọn canh giờ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNSET}>Không rõ giờ sinh</SelectItem>
                {BAT_TU_BIRTH_TIME_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {atBirthLimit ? (
          <p className="mt-4 text-sm" style={{ color: CT.red }}>
            Liên hệ hỗ trợ nếu cần sửa thêm.
          </p>
        ) : null}

        {recomputePending ? (
          <p className="mt-6 text-sm" style={{ color: CT.goldDeep }}>
            Đang chấm lại lá số…
          </p>
        ) : null}
        {recomputeFailed ? (
          <p className="mt-6 text-sm" style={{ color: CT.red }}>
            Lần chấm lại gần nhất thất bại — thử lưu lại.
          </p>
        ) : null}

        <div
          className="mt-9 border-t pt-4"
          style={{ borderColor: CT.hairline }}
        >
          <Mono className="text-[9px]" style={{ color: CT.red }}>
            Vùng nhạy cảm
          </Mono>
          <div className="mt-3 flex flex-col gap-3">
            <button
              type="button"
              disabled={exporting}
              onClick={() => handleExportData()}
              className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent p-0 text-left disabled:opacity-60"
            >
              <div>
                <div
                  className="font-[family-name:var(--font-display-2)] text-[13.5px] font-semibold tracking-[-0.005em]"
                  style={{ color: CT.ink }}
                >
                  Tải xuống dữ liệu
                </div>
                <div className="mt-0.5 text-[11.5px]" style={{ color: CT.muted }}>
                  Lá số + sổ ngày — file JSON
                </div>
              </div>
              <span style={{ color: CT.goldDeep }}>›</span>
            </button>

            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent p-0 text-left"
            >
              <div>
                <div
                  className="font-[family-name:var(--font-display-2)] text-[13.5px] font-semibold tracking-[-0.005em]"
                  style={{ color: CT.red }}
                >
                  Xoá tài khoản
                </div>
                <div className="mt-0.5 text-[11.5px]" style={{ color: CT.muted }}>
                  Không khôi phục được
                </div>
              </div>
              <span style={{ color: CT.red }}>›</span>
            </button>

            <Link
              to="/toi/cai-dat"
              className="flex items-center justify-between no-underline"
            >
              <div>
                <div
                  className="font-[family-name:var(--font-display-2)] text-[13.5px] font-semibold tracking-[-0.005em]"
                  style={{ color: CT.ink }}
                >
                  Cài đặt & quyền riêng tư
                </div>
                <div className="mt-0.5 text-[11.5px]" style={{ color: CT.muted }}>
                  Thông báo, PWA, đăng xuất
                </div>
              </div>
              <span style={{ color: CT.goldDeep }}>›</span>
            </Link>
          </div>
        </div>
      </div>

      <CConfirmDialog
        open={deleteOpen}
        title={
          <>
            Xoá tài khoản
            <br />
            vĩnh viễn?
          </>
        }
        description="Chúng tôi sẽ xử lý yêu cầu qua email trong thời hạn luật định. Hành động này không khôi phục được."
        confirmLabel="Gửi yêu cầu"
        onConfirm={confirmDeleteAccount}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
