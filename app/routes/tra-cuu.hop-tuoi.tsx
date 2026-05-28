import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { CHopTuoiLoadingScreen } from "~/components/direction-c/CHopTuoiLoadingScreen";
import { CTraCuuSegmentedNav } from "~/components/direction-c/CTraCuuSegmentedNav";
import { CTopStrip } from "~/components/brand";
import { ErrorBanner } from "~/components/ErrorBanner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  BAT_TU_BIRTH_TIME_OPTIONS,
  ddMmYyyyInputToBatTuBirthDate,
  formatDdMmYyyyWithAutoSlash,
  gioSinhToBatTuBirthTime,
  gioiTinhToBatTuGender,
  isPartialDdMmYyyyInput,
  ngaySinhToBatTuBirthDate,
  profileToBatTuPersonQuery,
} from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import { CT } from "~/lib/c-tokens";
import { hopTuoiPayloadToPanel } from "~/lib/hop-tuoi-result";
import { persistHopTuoiKetQua } from "~/lib/hop-tuoi-session";
import { laSoJsonToRevealProps, profileHasLaso } from "~/lib/la-so-ui";
import { BAT_TU_SOURCE_TRA_CUU } from "~/lib/tra-cuu-pick";
import { useProfile } from "~/hooks/useProfile";

const HOP_OTHER_BIRTH_TIME_DEFAULT = "__default__";

const DISPLAY2 = { fontFamily: "var(--display-2)" } as const;

const PURPOSE_OPTIONS = [
  { label: "cưới hỏi", value: "PHU_THE" },
  { label: "hợp tác", value: "DOI_TAC" },
  { label: "cộng sự", value: "DOI_TAC" },
  { label: "sống chung", value: "PHU_THE" },
] as const;

function formatBirthTimeShort(value: string): string {
  if (value === HOP_OTHER_BIRTH_TIME_DEFAULT) {
    return "Ngọ · 11–12h";
  }
  const code = Number.parseInt(value, 10);
  const opt = BAT_TU_BIRTH_TIME_OPTIONS.find((o) => o.value === code);
  if (!opt) return "—";
  const short = opt.label.replace(/^Giờ\s+/i, "").split("(")[0]?.trim();
  return short ?? opt.label;
}

function formatProfileBirthLine(profile: {
  ngay_sinh: string | null;
  gio_sinh: string | null;
}): string {
  const date = profile.ngay_sinh
    ? ngaySinhToBatTuBirthDate(profile.ngay_sinh)?.replace(/\//g, ".")
    : null;
  const code = gioSinhToBatTuBirthTime(profile.gio_sinh);
  const timeLabel =
    code != null
      ? BAT_TU_BIRTH_TIME_OPTIONS.find((o) => o.value === code)?.label.split("(")[0]?.trim()
      : null;
  return [date, timeLabel].filter(Boolean).join(" · ") || "—";
}

function ageFromNgaySinh(ngaySinh: string | null): string | null {
  if (!ngaySinh) return null;
  const y = Number.parseInt(ngaySinh.slice(0, 4), 10);
  if (!Number.isFinite(y)) return null;
  const age = new Date().getFullYear() - y;
  return age > 0 ? `${age} tuổi` : null;
}

export default function TraCuuHopTuoiRoute() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile();
  const [form, setForm] = useState({
    otherName: "",
    ngaySinh: "",
    otherBirthTime: HOP_OTHER_BIRTH_TIME_DEFAULT,
    gioiTinh: "" as "nam" | "nu" | "",
    relationshipType: "PHU_THE",
    purposeLabel: "cưới hỏi",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const hasLaso = profile ? profileHasLaso(profile.la_so) : false;
  const laso = profile ? laSoJsonToRevealProps(profile.la_so) : null;

  useEffect(() => {
    if (!profileLoading && profile && !hasLaso) {
      navigate("/toi/la-so", { replace: true });
    }
  }, [profileLoading, profile, hasLaso, navigate]);

  const birthLine = profile ? formatProfileBirthLine(profile) : "—";
  const ageLabel = profile ? ageFromNgaySinh(profile.ngay_sinh) : null;

  const hopOtherNgayInvalid =
    form.ngaySinh.trim().length > 0 &&
    ddMmYyyyInputToBatTuBirthDate(form.ngaySinh.trim()) == null &&
    !isPartialDdMmYyyyInput(form.ngaySinh);

  async function handleSubmit() {
    if (!profile || !form.ngaySinh || !form.gioiTinh) return;
    const p1 = profileToBatTuPersonQuery(profile);
    if (!p1.birth_date) {
      toast.error("Hồ sơ thiếu ngày sinh.");
      return;
    }
    const p2Date = ddMmYyyyInputToBatTuBirthDate(form.ngaySinh.trim());
    if (!p2Date) {
      toast.error("Ngày sinh người kia cần đúng DD/MM/YYYY.");
      return;
    }
    const p2Gender = gioiTinhToBatTuGender(form.gioiTinh);
    if (p2Gender === undefined) {
      toast.error("Chọn giới tính người kia.");
      return;
    }

    setBusy(true);
    setErr(null);
    try {
      const p2BirthTime =
        form.otherBirthTime === HOP_OTHER_BIRTH_TIME_DEFAULT
          ? 11
          : Number.parseInt(form.otherBirthTime, 10);
      const res = await invokeBatTu({
        op: "hop-tuoi",
        body: {
          person1_birth_date: p1.birth_date,
          person1_birth_time: p1.birth_time ?? 11,
          person1_gender: p1.gender ?? 1,
          person2_birth_date: p2Date,
          person2_birth_time:
            Number.isFinite(p2BirthTime) && p2BirthTime >= 0 ? p2BirthTime : 11,
          person2_gender: p2Gender,
          ...(form.relationshipType.trim()
            ? { relationship_type: form.relationshipType.trim() }
            : {}),
          source: BAT_TU_SOURCE_TRA_CUU,
        },
      });

      if (!res.ok) {
        setErr(res.message);
        toast.error(res.message);
        return;
      }

      const mapped = hopTuoiPayloadToPanel(res.data);
      if (!mapped) {
        const msg = "Không tải được kết quả hợp tuổi. Thử lại sau.";
        setErr(msg);
        toast.error(msg);
        return;
      }

      const ketQuaState = {
        panel: mapped,
        payload: res.data,
        otherName: form.otherName.trim() || "Đối phương",
        selfName: profile.display_name ?? "Bạn",
        purposeLabel: form.purposeLabel,
      };
      persistHopTuoiKetQua(ketQuaState);
      navigate("/tra-cuu/hop-tuoi/ket-qua", {
        state: ketQuaState,
      });
    } finally {
      setBusy(false);
    }
  }

  if (profileLoading || !profile || !hasLaso) {
    return (
      <div
        className="flex min-h-full flex-col px-6 py-8"
        style={{ background: CT.paper, color: CT.muted, fontFamily: "var(--serif)" }}
      >
        Đang tải…
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <CTopStrip />
      <CTraCuuSegmentedNav />

      <div className="flex-1 overflow-auto px-6 pb-24 pt-[22px]">
        <div className="font-serif text-[13px]" style={{ color: CT.muted }}>
          Bạn
        </div>
        <div
          className="mt-2 px-3.5 py-3"
          style={{ background: CT.forest, color: CT.cream }}
        >
          <div
            className="text-[15px] font-bold tracking-[-0.005em]"
            style={{ ...DISPLAY2, color: CT.cream }}
          >
            {profile.display_name ?? "Bạn"}
          </div>
          <div
            className="mt-1 font-serif text-xs"
            style={{ color: "rgba(237,231,211,0.65)" }}
          >
            {birthLine}
            {ageLabel ? ` · ${ageLabel}` : ""}
            {laso?.menh ? ` · mệnh ${laso.menh}` : ""}
          </div>
        </div>

        <div className="mt-[22px] font-serif text-[13px]" style={{ color: CT.muted }}>
          Đối phương
        </div>
        <div
          className="mt-2 border bg-white px-3.5 py-3"
          style={{ borderColor: CT.hairline }}
        >
          <input
            type="text"
            placeholder="Họ tên (tuỳ chọn)"
            value={form.otherName}
            onChange={(e) => setForm((f) => ({ ...f, otherName: e.target.value }))}
            className="w-full border-none bg-transparent p-0 text-[15px] font-bold tracking-[-0.005em] outline-none"
            style={{ ...DISPLAY2, color: CT.ink }}
          />
          <div className="mt-2.5 grid grid-cols-2 gap-3.5">
            <div>
              <div className="font-serif text-[10px]" style={{ color: CT.muted }}>
                Ngày sinh
              </div>
              <input
                type="text"
                inputMode="numeric"
                placeholder="DD/MM/YYYY"
                maxLength={10}
                value={form.ngaySinh}
                aria-invalid={hopOtherNgayInvalid}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    ngaySinh: formatDdMmYyyyWithAutoSlash(e.target.value),
                  }))
                }
                className="mt-0.5 w-full border-none bg-transparent p-0 text-[13px] font-semibold tracking-[-0.005em] outline-none tabular-nums"
                style={{ ...DISPLAY2, color: CT.ink }}
              />
            </div>
            <div>
              <div className="font-serif text-[10px]" style={{ color: CT.muted }}>
                Giờ sinh
              </div>
              <Select
                value={form.otherBirthTime}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, otherBirthTime: v }))
                }
              >
                <SelectTrigger
                  aria-label="Giờ sinh đối phương"
                  className="mt-0.5 h-auto w-full cursor-pointer border-none bg-transparent p-0 text-[13px] font-semibold tracking-[-0.005em] shadow-none [&>svg]:hidden"
                  style={{ ...DISPLAY2, color: CT.ink }}
                >
                  <SelectValue placeholder="Chọn giờ sinh" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value={HOP_OTHER_BIRTH_TIME_DEFAULT}
                    textValue="Ngọ · 11–12h"
                  >
                    Không biết — Giờ Ngọ (11–13h)
                  </SelectItem>
                  {BAT_TU_BIRTH_TIME_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={String(opt.value)}
                      textValue={formatBirthTimeShort(String(opt.value))}
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-3 flex gap-1">
            {(["nam", "nu"] as const).map((g) => {
              const sel = form.gioiTinh === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, gioiTinh: g }))}
                  className="flex-1 cursor-pointer border-none py-2 text-center text-[11px] font-bold uppercase tracking-[0.06em]"
                  style={{
                    ...DISPLAY2,
                    background: sel ? CT.forest : "transparent",
                    color: sel ? CT.cream : CT.muted,
                    border: sel ? "none" : `1px solid ${CT.hairline}`,
                  }}
                >
                  {g === "nam" ? "Nam" : "Nữ"}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-[22px] font-serif text-[13px]" style={{ color: CT.muted }}>
          Để
        </div>
        <div className="mt-2 font-serif text-[13px] leading-relaxed" style={{ color: CT.ink }}>
          {PURPOSE_OPTIONS.map((p, i) => {
            const sel = form.purposeLabel === p.label;
            return (
              <span key={`${p.label}-${i}`}>
                <button
                  type="button"
                  className="cursor-pointer border-none bg-transparent p-0 font-serif text-[13px]"
                  style={{
                    color: CT.ink,
                    fontWeight: sel ? 600 : 400,
                    borderBottom: sel ? `1.5px solid ${CT.goldDeep}` : undefined,
                  }}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      relationshipType: p.value,
                      purposeLabel: p.label,
                    }))
                  }
                >
                  {p.label}
                </button>
                {i < PURPOSE_OPTIONS.length - 1 ? ", " : ""}
              </span>
            );
          })}
        </div>

        {hopOtherNgayInvalid ? (
          <p className="mt-2 font-serif text-[11px]" style={{ color: CT.red }}>
            Đúng DD/MM/YYYY, ngày có thật.
          </p>
        ) : null}

        <button
          type="button"
          disabled={
            busy ||
            !form.ngaySinh.trim() ||
            !form.gioiTinh ||
            ddMmYyyyInputToBatTuBirthDate(form.ngaySinh.trim()) == null
          }
          onClick={() => void handleSubmit()}
          className="mt-8 w-full cursor-pointer border-none py-[15px] text-[13px] font-extrabold uppercase tracking-[0.08em] disabled:opacity-60"
          style={{ ...DISPLAY2, background: CT.forest, color: CT.cream }}
        >
          {busy ? "Đang phân tích…" : "Xem độ hợp"}
        </button>

        {err ? (
          <div className="mt-4">
            <ErrorBanner message={err} />
          </div>
        ) : null}
      </div>

      {busy ? (
        <div
          className="absolute inset-0 z-20 flex flex-col"
          style={{ background: CT.paper }}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <CHopTuoiLoadingScreen purposeLabel={form.purposeLabel} />
        </div>
      ) : null}
    </div>
  );
}
