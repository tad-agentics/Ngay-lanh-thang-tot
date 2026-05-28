import { Link, useNavigate } from "react-router";

import { CTopStrip } from "~/components/brand";
import { ErrorBanner } from "~/components/ErrorBanner";
import { CLichRecomputeSkeleton } from "~/components/direction-c/CLichRecomputeSkeleton";
import { CLichSegmentedNav } from "~/components/direction-c/CLichSegmentedNav";
import { CTodayReasoning } from "~/components/direction-c/CTodayReasoning";
import { LichToPageCard } from "~/components/direction-c/LichToPageCard";
import { COfflineBanner } from "~/components/direction-c/COfflineBanner";
import { useInlineDayReading } from "~/hooks/useInlineDayReading";
import { useLaSoRecomputeGate } from "~/hooks/useLaSoRecomputeGate";
import { useTodayLichData } from "~/hooks/useTodayLichData";
import { CT } from "~/lib/c-tokens";
import { ngayHomNayToLichCard } from "~/lib/lich-format";
import { addDaysToIso } from "~/hooks/useStreak";

export function CHomeScreen() {
  const navigate = useNavigate();
  const { pending: recomputePending } = useLaSoRecomputeGate();
  const {
    loading,
    error,
    today,
    menh,
    canBatTu,
    rawPayload,
    online,
    todayIso,
    recomputePending: recomputePendingFromData,
  } = useTodayLichData();

  const showRecomputeSkeleton = recomputePending || recomputePendingFromData;

  const { text: readingText, loading: readingLoading } = useInlineDayReading({
    iso: todayIso,
    endpoint: "ngay-hom-nay",
    batTuPayload: rawPayload,
    enabled: Boolean(today && rawPayload && online && !showRecomputeSkeleton),
  });

  const prevIso = addDaysToIso(todayIso, -1);
  const nextIso = addDaysToIso(todayIso, 1);

  return (
    <main
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink }}
    >
      {!online ? <COfflineBanner /> : null}
      <CTopStrip />
      <CLichSegmentedNav />

      <div className="flex-1 overflow-y-auto px-[22px] pb-24 pt-2">
        {error ? <ErrorBanner message={error} /> : null}
        {!canBatTu && !loading ? (
          <p
            className="font-serif text-sm"
            style={{ color: CT.muted, lineHeight: 1.55 }}
          >
            Hoàn thành{" "}
            <Link to="/gio-sinh" className="underline" style={{ color: CT.goldDeep }}>
              lập lịch
            </Link>{" "}
            để xem trang hôm nay.
          </p>
        ) : null}

        {loading && !showRecomputeSkeleton ? (
          <p
            className="py-12 text-center font-serif text-sm"
            style={{ color: CT.muted }}
          >
            Đang mở trang hôm nay…
          </p>
        ) : null}

        {showRecomputeSkeleton ? <CLichRecomputeSkeleton variant="page" /> : null}

        {today && !showRecomputeSkeleton ? (
          <LichToPageCard
            {...ngayHomNayToLichCard(today, menh, todayIso)}
            quote={today.homeSummaryLine}
            prevLabel={`‹ ${prevIso.slice(8, 10)}.${prevIso.slice(5, 7)} hôm qua`}
            nextLabel={`ngày mai ${nextIso.slice(8, 10)}.${nextIso.slice(5, 7)} ›`}
            onPrev={() => void navigate(`/ngay/${prevIso}`)}
            onNext={() => void navigate(`/ngay/${nextIso}`)}
            afterRows={
              <CTodayReasoning
                text={readingText}
                fallbackText={today.homeSummaryLine}
                loading={readingLoading}
                onCtaClick={() => void navigate(`/luan-ai/day-${todayIso}`)}
              />
            }
          />
        ) : null}
      </div>
    </main>
  );
}
