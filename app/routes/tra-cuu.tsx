import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CPickLoadingScreen } from "~/components/direction-c/CPickLoadingScreen";
import { CTraCuuSegmentedNav } from "~/components/direction-c/CTraCuuSegmentedNav";
import { CTopStrip } from "~/components/brand";
import { useTraCuuPickOverlay } from "~/hooks/useTraCuuPickOverlay";
import type { TuTruIntent } from "~/lib/api-types";
import { CT } from "~/lib/c-tokens";
import type { TraCuuPickPending } from "~/lib/tra-cuu-pick";
import {
  addDaysIso,
  isoDateToDdMmYyyy,
  localTodayIsoDate,
} from "~/lib/tu-tru-dates";
import { TU_TRU_INTENT_OPTIONS } from "~/lib/tu-tru-intents";
import { consumeTraCuuFormPreset } from "~/lib/tra-cuu-session";
import { consumeTraCuuIntentPreset } from "~/lib/hop-tuoi-ui";
import { useProfile } from "~/hooks/useProfile";

const CHON_NGAY_INTENT_OPTIONS = TU_TRU_INTENT_OPTIONS.filter(
  (o) => o.value !== "MAC_DINH",
);

const QUICK_INTENTS: { label: string; value: TuTruIntent }[] = [
  { label: "Cưới hỏi", value: "CUOI_HOI" },
  { label: "Ký hợp đồng", value: "KY_HOP_DONG" },
  { label: "Xuất hành", value: "XUAT_HANH" },
  { label: "Động thổ", value: "DONG_THO" },
  { label: "Mua nhà", value: "MUA_NHA_DAT" },
];

const RANGE_PRESETS = [
  { label: "7 ngày", days: 7 },
  { label: "14 ngày", days: 14 },
  { label: "1 tháng", days: 30 },
  { label: "3 tháng", days: 90 },
] as const;

function formatIsoDot(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d} · ${m} · ${y}`;
}

function splitIntentLabel(label: string): { main: string; accent: string | null } {
  const parts = label.trim().split(/\s+/);
  if (parts.length <= 1) return { main: label, accent: null };
  const mid = Math.ceil(parts.length / 2);
  return {
    main: parts.slice(0, mid).join(" "),
    accent: parts.slice(mid).join(" "),
  };
}

export default function TraCuuRoute() {
  const { profile, loading: profileLoading } = useProfile();
  const { overlayOpen, slow, intentLabel, busy, startPick, cancel } =
    useTraCuuPickOverlay();
  const [rangeDays, setRangeDays] = useState<number>(30);
  const [intent, setIntent] = useState<TuTruIntent | "">("");
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    const formPreset = consumeTraCuuFormPreset();
    if (formPreset) {
      setIntent(formPreset.intent);
      setRangeDays(formPreset.daysInclusive);
      return;
    }
    const hopPreset = consumeTraCuuIntentPreset();
    if (hopPreset) {
      setIntent(hopPreset.intent);
    }
  }, []);

  const rangeStart = useMemo(() => localTodayIsoDate(), []);
  const rangeEnd = useMemo(() => {
    const end = addDaysIso(rangeStart, rangeDays - 1);
    return end ?? rangeStart;
  }, [rangeStart, rangeDays]);

  const intentLabelSelected =
    CHON_NGAY_INTENT_OPTIONS.find((o) => o.value === intent)?.label ?? null;
  const intentParts = intentLabelSelected
    ? splitIntentLabel(intentLabelSelected)
    : { main: "Chọn việc", accent: null };

  async function runLookup() {
    if (!profile?.ngay_sinh) {
      toast.error("Cần ngày sinh trong hồ sơ.");
      return;
    }
    if (!intent || intent === "MAC_DINH") {
      toast.error("Chọn loại sự kiện.");
      return;
    }
    const rs = isoDateToDdMmYyyy(rangeStart);
    const re = isoDateToDdMmYyyy(rangeEnd);
    if (!rs || !re) {
      toast.error("Khoảng ngày không hợp lệ.");
      return;
    }
    const label =
      TU_TRU_INTENT_OPTIONS.find((o) => o.value === intent)?.label ?? intent;
    const pending: TraCuuPickPending = {
      intent,
      intentLabel: label,
      rangeStart,
      rangeEnd,
      daysInclusive: rangeDays,
    };
    await startPick(pending);
  }

  const disabledForm = profileLoading || !profile || overlayOpen;

  return (
    <div
      className="relative flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <CTopStrip />
      <CTraCuuSegmentedNav />

      <div className="flex-1 overflow-auto px-6 pb-24 pt-0">
        {!profileLoading && profile && !profile.ngay_sinh ? (
          <p
            className="mb-4 font-serif text-[13px] leading-relaxed"
            style={{ color: CT.muted }}
          >
            Thêm ngày sinh trong hồ sơ để tra cứu ngày lành theo Bát Tự.
          </p>
        ) : null}

        <div className="font-serif text-[13px]" style={{ color: CT.muted }}>
          Tôi sắp làm
        </div>

        <button
          type="button"
          disabled={disabledForm}
          onClick={() => setPickerOpen((o) => !o)}
          className="mt-1.5 flex w-full cursor-pointer items-start justify-between border bg-white p-3.5 text-left disabled:opacity-60"
          style={{ borderColor: CT.goldDeep }}
        >
          <div>
            <div
              className="font-[family-name:var(--font-display)] text-[26px] font-extrabold uppercase leading-[1.05] tracking-[-0.01em]"
              style={{ color: CT.ink }}
            >
              {intentParts.main}
              {intentParts.accent ? (
                <>
                  <br />
                  <span style={{ color: CT.goldDeep, fontWeight: 700 }}>
                    {intentParts.accent}
                  </span>
                </>
              ) : null}
            </div>
            <div className="mt-2 font-serif text-[11.5px]" style={{ color: CT.muted }}>
              {CHON_NGAY_INTENT_OPTIONS.length} việc · chọn lại
            </div>
          </div>
          <span className="font-serif text-base" style={{ color: CT.goldDeep }}>
            ▾
          </span>
        </button>

        {pickerOpen ? (
          <div
            className="mt-1 max-h-48 overflow-auto border bg-white"
            style={{ borderColor: CT.hairline }}
          >
            {CHON_NGAY_INTENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className="block w-full border-none bg-transparent px-3.5 py-2.5 text-left font-serif text-[13px] cursor-pointer"
                style={{
                  color: intent === opt.value ? CT.goldDeep : CT.ink,
                  fontWeight: intent === opt.value ? 600 : 400,
                  borderBottom: `1px solid ${CT.hairline2}`,
                }}
                onClick={() => {
                  setIntent(opt.value);
                  setPickerOpen(false);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : null}

        <div
          className="mt-3.5 font-serif text-xs leading-relaxed"
          style={{ color: CT.muted }}
        >
          Gợi ý:&nbsp;
          {QUICK_INTENTS.map((item, i, arr) => (
            <span key={item.value}>
              <button
                type="button"
                className="cursor-pointer border-none bg-transparent p-0 font-serif text-xs"
                style={{ color: CT.ink }}
                disabled={disabledForm}
                onClick={() => setIntent(item.value)}
              >
                {item.label}
              </button>
              {i < arr.length - 1 ? ", " : ""}
            </span>
          ))}
        </div>

        <div className="mt-7 font-serif text-[13px]" style={{ color: CT.muted }}>
          Trong khoảng
        </div>
        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2.5">
          <div
            className="border bg-white px-3 py-2.5"
            style={{ borderColor: CT.hairline }}
          >
            <div className="font-serif text-[10px]" style={{ color: CT.muted }}>
              Từ ngày
            </div>
            <div
              className="mt-0.5 font-[family-name:var(--font-display)] text-sm font-bold tracking-[-0.005em]"
              style={{ color: CT.ink }}
            >
              {formatIsoDot(rangeStart)}
            </div>
          </div>
          <span className="font-serif" style={{ color: CT.muted }}>
            →
          </span>
          <div
            className="border bg-white px-3 py-2.5"
            style={{ borderColor: CT.hairline }}
          >
            <div className="font-serif text-[10px]" style={{ color: CT.muted }}>
              Đến ngày
            </div>
            <div
              className="mt-0.5 font-[family-name:var(--font-display)] text-sm font-bold tracking-[-0.005em]"
              style={{ color: CT.ink }}
            >
              {formatIsoDot(rangeEnd)}
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex gap-1.5">
          {RANGE_PRESETS.map((preset) => {
            const sel = rangeDays === preset.days;
            return (
              <button
                key={preset.label}
                type="button"
                disabled={disabledForm}
                onClick={() => setRangeDays(preset.days)}
                className="flex-1 cursor-pointer border-none py-1.5 text-center font-[family-name:var(--font-mono)] text-[9.5px] uppercase tracking-[0.06em] disabled:opacity-60"
                style={{
                  background: sel ? CT.forest : "transparent",
                  color: sel ? CT.cream : CT.muted,
                  border: sel ? "none" : `1px solid ${CT.hairline}`,
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={busy || disabledForm || !profile?.ngay_sinh}
          onClick={() => void runLookup()}
          className="mt-8 w-full cursor-pointer border-none py-[15px] font-[family-name:var(--font-display)] text-[13px] font-extrabold uppercase tracking-[0.08em] disabled:opacity-60"
          style={{ background: CT.forest, color: CT.cream }}
        >
          {busy ? "Đang tra…" : "Tìm ngày tốt nhất"}
        </button>
      </div>

      {overlayOpen ? (
        <div
          className="absolute inset-0 z-20 flex flex-col"
          style={{ background: CT.paper }}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <CPickLoadingScreen
            intentLabel={intentLabel}
            slow={slow}
            onCancel={cancel}
          />
        </div>
      ) : null}
    </div>
  );
}
