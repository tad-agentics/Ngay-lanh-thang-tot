import { useMemo } from "react";

import { ErrorBanner } from "~/components/ErrorBanner";
import { CLichRecomputeSkeleton } from "~/components/direction-c/CLichRecomputeSkeleton";
import {
  CLichMonthGrid,
  CLichMonthScoreLegend,
} from "~/components/direction-c/CLichMonthGrid";
import { useLaSoRecomputeGate } from "~/hooks/useLaSoRecomputeGate";
import { useLichThangData } from "~/hooks/useLichThangData";
import { useOnlineStatus } from "~/hooks/useOnlineStatus";
import type { Profile } from "~/lib/profile-context";
import { CT } from "~/lib/c-tokens";
import { laSoJsonToRevealProps } from "~/lib/la-so-ui";

export type CLichMonthCalendarSectionProps = {
  profile: Profile | null;
  profileLoading: boolean;
  year: number;
  month: number;
  todayIso: string;
  selectedIso: string;
  onShiftMonth: (delta: number) => void;
  onSelectDay: (iso: string) => void;
};

export function CLichMonthCalendarSection({
  profile,
  profileLoading,
  year,
  month,
  todayIso,
  selectedIso,
  onShiftMonth,
  onSelectDay,
}: CLichMonthCalendarSectionProps) {
  const { pending: recomputePending } = useLaSoRecomputeGate();
  const online = useOnlineStatus();

  const {
    days,
    lunarMonthLabel,
    loading,
    refreshing,
    error,
    recomputePending: hookRecomputePending,
  } = useLichThangData({
    profile,
    profileLoading,
    year,
    month,
    online,
  });

  const menh = useMemo(() => {
    const laso = profile ? laSoJsonToRevealProps(profile.la_so) : null;
    return laso?.menh ?? "bạn";
  }, [profile]);

  const showRecomputeSkeleton = recomputePending || hookRecomputePending;
  const showInitialLoading = loading && days.length === 0 && !showRecomputeSkeleton;

  return (
    <section className="mt-6">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div
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
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            type="button"
            aria-label="Tháng trước"
            onClick={() => onShiftMonth(-1)}
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
          <button
            type="button"
            aria-label="Tháng sau"
            onClick={() => onShiftMonth(1)}
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
      </div>

      <div
        style={{
          marginTop: 6,
          fontFamily: "var(--serif)",
          fontSize: 13,
          color: "var(--muted)",
          lineHeight: 1.5,
        }}
      >
        {lunarMonthLabel ? (
          <>
            {lunarMonthLabel}
            {" · "}
          </>
        ) : null}
        chấm theo bản mệnh{" "}
        <strong style={{ color: CT.ink, fontWeight: 600 }}>{menh}</strong>
        {refreshing ? (
          <>
            {" · "}
            <span style={{ color: CT.goldDeep, fontStyle: "italic" }}>
              Đang cập nhật…
            </span>
          </>
        ) : null}
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
