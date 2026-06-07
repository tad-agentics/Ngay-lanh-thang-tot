import { ErrorBanner } from "~/components/ErrorBanner";
import { CLichRecomputeSkeleton } from "~/components/direction-c/CLichRecomputeSkeleton";
import {
  CLichMonthGrid,
  CLichMonthScoreLegend,
} from "~/components/direction-c/CLichMonthGrid";
import { useLaSoRecomputeGate } from "~/hooks/useLaSoRecomputeGate";
import type { LichThangData } from "~/hooks/useLichThangData";
import { CT } from "~/lib/c-tokens";

export type CLichMonthCalendarSectionProps = {
  year: number;
  month: number;
  todayIso: string;
  selectedIso: string;
  monthThang: LichThangData;
  onShiftMonth: (delta: number) => void;
  onSelectDay: (iso: string) => void;
};

export function CLichMonthCalendarSection({
  year,
  month,
  todayIso,
  selectedIso,
  monthThang,
  onShiftMonth,
  onSelectDay,
}: CLichMonthCalendarSectionProps) {
  const { pending: recomputePending } = useLaSoRecomputeGate();

  const {
    days,
    loading,
    error,
    recomputePending: hookRecomputePending,
  } = monthThang;

  const showRecomputeSkeleton = recomputePending || hookRecomputePending;
  const showInitialLoading = loading && days.length === 0 && !showRecomputeSkeleton;

  return (
    <section className="mt-6">
      <div
        className="grid grid-cols-3 items-end"
        style={{ columnGap: 14 }}
      >
        <button
          type="button"
          aria-label="Tháng trước"
          onClick={() => onShiftMonth(-1)}
          className="justify-self-start"
          style={{
            color: CT.goldDeep,
            fontFamily: "var(--serif)",
            fontSize: 20.5,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          ‹
        </button>
        <div
          className="text-center"
          style={{
            fontFamily: "var(--display)",
            fontWeight: 800,
            fontSize: 28.5,
            color: CT.ink,
            lineHeight: 1,
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
          }}
        >
          Tháng {month} · {year}
        </div>
        <button
          type="button"
          aria-label="Tháng sau"
          onClick={() => onShiftMonth(1)}
          className="justify-self-end"
          style={{
            color: CT.goldDeep,
            fontFamily: "var(--serif)",
            fontSize: 20.5,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          ›
        </button>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {showRecomputeSkeleton ? (
        <CLichRecomputeSkeleton variant="month" />
      ) : showInitialLoading ? (
        <p className="py-12 text-center font-serif text-sm" style={{ color: CT.muted }}>
          Đang tải lịch tháng…
        </p>
      ) : days.length > 0 ? (
        <CLichMonthGrid
          year={year}
          month={month}
          days={days}
          todayIso={todayIso}
          selectedIso={selectedIso}
          onSelectDay={onSelectDay}
        />
      ) : null}

      <CLichMonthScoreLegend />
    </section>
  );
}
