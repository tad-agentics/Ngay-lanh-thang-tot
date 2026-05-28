import { Link } from "react-router";

import { ErrorBanner } from "~/components/ErrorBanner";
import { BackBar, Mono } from "~/components/brand";
import { DayLuanSectionedPanel } from "~/components/direction-c/DayLuanSectionedPanel";
import { useDayLuanReading } from "~/hooks/useDayLuanReading";
import { CT } from "~/lib/c-tokens";
import { buildDayLuanSectionRows } from "~/lib/day-luan-sectioned";
import { weekdayFromIso } from "~/lib/lich-format";
import { formatIsoDateLichHeader } from "~/lib/tu-tru-dates";

export function CAiSectionedScreen({ iso }: { iso: string }) {
  const {
    profileLoading,
    detailLoading,
    detailError,
    detail,
    unlocked,
    subActive,
  } = useDayLuanReading(iso);

  const loading = profileLoading || detailLoading;
  const sections = buildDayLuanSectionRows(detail);

  return (
    <main
      className="min-h-[100svh] flex flex-col"
      style={{ background: CT.paper, color: CT.ink }}
    >
      <BackBar
        title="Luận giải đầy đủ"
        endAdornment={<Mono style={{ color: CT.muted, fontSize: 9 }}>Có nguồn</Mono>}
      />

      <div className="flex-1 overflow-auto px-6 pt-2 pb-8">
        {loading ? (
          <p className="font-serif text-sm" style={{ color: CT.muted }}>
            Đang tải…
          </p>
        ) : null}
        {detailError ? <ErrorBanner message={detailError} /> : null}

        {!loading && !detailError && detail ? (
          <>
            <div className="flex items-baseline gap-2.5 mt-1.5 flex-wrap">
              <span
                style={{
                  fontFamily: "var(--display-2)",
                  fontWeight: 800,
                  fontSize: 22,
                  color: CT.ink,
                  letterSpacing: "-0.01em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatIsoDateLichHeader(iso)}
              </span>
              <span className="font-serif text-xs" style={{ color: CT.muted }}>
                · {weekdayFromIso(iso)}
                {detail.canChi ? ` · ${detail.canChi}` : ""}
              </span>
            </div>

            {!unlocked ? (
              <div className="mt-8 text-center">
                <p className="font-serif text-sm mb-4" style={{ color: CT.ink2 }}>
                  Cần gói lịch đang hoạt động để xem bản đầy đủ có nguồn.
                </p>
                <Link
                  to="/dat-lich"
                  className="inline-block py-3 px-6 font-display text-xs font-extrabold uppercase tracking-wider"
                  style={{ background: CT.forest, color: CT.cream }}
                >
                  {subActive ? "Tải lại" : "Lập lịch / gia hạn"}
                </Link>
              </div>
            ) : (
              <DayLuanSectionedPanel
                rows={sections}
                totalScore={detail.score ?? null}
              />
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
