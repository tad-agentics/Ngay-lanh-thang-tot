import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { BackBar, Mono } from "~/components/brand";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useProfile } from "~/hooks/useProfile";
import {
  BAT_TU_BIRTH_TIME_OPTIONS,
  ddMmYyyyInputToBatTuBirthDate,
  formatDdMmYyyyWithAutoSlash,
  gioiTinhToBatTuGender,
  gioSinhToBatTuBirthTime,
  isoYmdToDdMmYyyyInput,
} from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import { CT } from "~/lib/c-tokens";
import { supabase } from "~/lib/supabase";

const UNSET = "__unset__";

export function CEditProfileScreen() {
  const navigate = useNavigate();
  const { profile, loading, reload } = useProfile();
  const [displayName, setDisplayName] = useState("");
  const [ngaySinh, setNgaySinh] = useState("");
  const [birthTimeCode, setBirthTimeCode] = useState(UNSET);
  const [gioiTinh, setGioiTinh] = useState<"" | "nam" | "nu">("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile || loading) return;
    setDisplayName(profile.display_name ?? "");
    setNgaySinh(isoYmdToDdMmYyyyInput(profile.ngay_sinh));
    const code = gioSinhToBatTuBirthTime(profile.gio_sinh);
    setBirthTimeCode(code !== undefined ? String(code) : UNSET);
    setGioiTinh(profile.gioi_tinh ?? "");
  }, [profile, loading]);

  async function handleSave() {
    if (!profile) return;
    const birth_date = ddMmYyyyInputToBatTuBirthDate(ngaySinh.trim());
    if (!birth_date) {
      toast.error("Ngày sinh cần đúng DD/MM/YYYY.");
      return;
    }
    if (!gioiTinh) {
      toast.error("Chọn giới tính.");
      return;
    }

    setSaving(true);
    const body: Record<string, unknown> = {
      birth_date,
      gender: gioiTinhToBatTuGender(gioiTinh),
      tz: "Asia/Ho_Chi_Minh",
    };
    if (birthTimeCode !== UNSET) {
      body.birth_time = Number(birthTimeCode);
    }

    const nameTrim = displayName.trim();
    if (nameTrim && nameTrim !== (profile.display_name ?? "")) {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: nameTrim })
        .eq("id", profile.id);
      if (error) {
        setSaving(false);
        toast.error(error.message);
        return;
      }
    }

    const res = await invokeBatTu<unknown>({ op: "recompute-la-so", body });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.message ?? "Không cập nhật lá số được.");
      return;
    }
    await reload();
    window.dispatchEvent(new Event("ngaytot:profile-refresh"));
    toast.success("Đã cập nhật hồ sơ và chấm lại lá số.");
    navigate("/toi", { replace: true });
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
            disabled={saving}
            onClick={() => void handleSave()}
            className="cursor-pointer border-none bg-transparent p-0 font-serif text-[12.5px]"
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
              className="mt-1 w-full border-0 border-b bg-transparent pb-1.5 pt-1 font-[family-name:var(--font-display-2)] text-[17px] font-semibold tracking-[-0.005em] outline-none"
              style={{ borderColor: CT.goldDeep, color: CT.ink }}
            />
          </label>

          <div>
            <span className="text-[11.5px]" style={{ color: CT.muted }}>
              Giờ sinh — 12 canh
            </span>
            <Select value={birthTimeCode} onValueChange={setBirthTimeCode}>
              <SelectTrigger
                className="mt-1 h-auto border-0 border-b bg-transparent px-0 pb-1.5 shadow-none"
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

        {profile.la_so_recompute_status === "pending" ? (
          <p className="mt-6 text-sm" style={{ color: CT.goldDeep }}>
            Đang chấm lại lá số…
          </p>
        ) : null}

        <div
          className="mt-9 border-t pt-4"
          style={{ borderColor: CT.hairline }}
        >
          <Mono className="text-[9px]" style={{ color: CT.red }}>
            Vùng nhạy cảm
          </Mono>
          <Link
            to="/toi/cai-dat"
            className="mt-3 flex items-center justify-between no-underline"
          >
            <div>
              <div
                className="font-[family-name:var(--font-display-2)] text-[13.5px] font-semibold tracking-[-0.005em]"
                style={{ color: CT.ink }}
              >
                Cài đặt & quyền riêng tư
              </div>
              <div className="mt-0.5 text-[11.5px]" style={{ color: CT.muted }}>
                Thông báo, PWA, xoá tài khoản
              </div>
            </div>
            <span style={{ color: CT.goldDeep }}>›</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
