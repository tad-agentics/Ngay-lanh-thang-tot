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
    <section>
      <div
        className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center"
        style={{ columnGap: 10 }}
      >
        <button
          type="button"
          aria-label="Tháng trước"
          onClick={() => onShiftMonth(-1)}
          className="flex min-h-[44px] max-w-full items-center justify-self-start gap-1.5 border-none bg-transparent text-left"
          style={{
            color: CT.goldDeep,
            cursor: "pointer",
            padding: 0,
          }}
        >
          <span
            aria-hidden
            style={{
              fontFamily: "var(--serif)",
              fontSize: 15.5,
              lineHeight: 1,
            }}
          >
            ‹
          </span>
          <span
            style={{
              fontFamily: "var(--display-2)",
              fontWeight: 700,
              fontSize: "clamp(8.5px, 2.4vw, 11px)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              lineHeight: 1.15,
            }}
          >
            Tháng trước
          </span>
        </button>
        <div
          className="flex min-h-[44px] items-center justify-center px-1 text-center"
          style={{
            fontFamily: "var(--display)",
            fontWeight: 800,
            fontSize: "clamp(20px, 5.8vw, 28.5px)",
            color: CT.ink,
            lineHeight: 1,
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
          }}
        >
          Tháng {month} · {year}
        </div>
        <button
          type="button"
          aria-label="Tháng sau"
          onClick={() => onShiftMonth(1)}
          className="flex min-h-[44px] max-w-full items-center justify-self-end gap-1.5 border-none bg-transparent text-right"
          style={{
            color: CT.goldDeep,
            cursor: "pointer",
            padding: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--display-2)",
              fontWeight: 700,
              fontSize: "clamp(8.5px, 2.4vw, 11px)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              lineHeight: 1.15,
            }}
          >
            Tháng sau
          </span>
          <span
            aria-hidden
            style={{
              fontFamily: "var(--serif)",
              fontSize: 15.5,
              lineHeight: 1,
            }}
          >
            ›
          </span>
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
