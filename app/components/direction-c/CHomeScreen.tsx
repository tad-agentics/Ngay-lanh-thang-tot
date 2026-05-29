import { Link, useNavigate } from "react-router";

import { Mono } from "~/components/brand";
import { ErrorBanner } from "~/components/ErrorBanner";
import { CLichRecomputeSkeleton } from "~/components/direction-c/CLichRecomputeSkeleton";
import { CLichSegmentedNav } from "~/components/direction-c/CLichSegmentedNav";
import { CMeLockedBaziCard } from "~/components/direction-c/CMeLockedBaziCard";
import { CTodayReasoning } from "~/components/direction-c/CTodayReasoning";
import { LichToPageCard } from "~/components/direction-c/LichToPageCard";
import { COfflineBanner } from "~/components/direction-c/COfflineBanner";
import { useInlineDayReading } from "~/hooks/useInlineDayReading";
import { useLaSoRecomputeGate } from "~/hooks/useLaSoRecomputeGate";
import { useProfile } from "~/hooks/useProfile";
import { useTodayLichData } from "~/hooks/useTodayLichData";
import { useAuth } from "~/lib/auth";
import {
  canUseBaziReading,
  hasYearlySubscription,
  subscriptionActive,
} from "~/lib/entitlements";
import { buildHomeInlineFallback } from "~/lib/home-bat-tu";
import { CT } from "~/lib/c-tokens";
import { ngayHomNayToLichCard } from "~/lib/lich-format";
import { addDaysToIso } from "~/lib/tu-tru-dates";

export function CHomeScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
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

  const {
    text: readingText,
    loading: readingLoading,
    instantTyping,
    markTypingSeen,
  } = useInlineDayReading({
    iso: todayIso,
    endpoint: "ngay-hom-nay",
    batTuPayload: rawPayload,
    enabled: Boolean(
      user && today && rawPayload && online && !showRecomputeSkeleton,
    ),
  });

  const inlineFallbackText =
    today?.homeSummaryLine.trim() ||
    (today ? buildHomeInlineFallback(today) : "");

  const prevIso = addDaysToIso(todayIso, -1);
  const nextIso = addDaysToIso(todayIso, 1);
  const offlineMode = !online;
  const baziUnlocked = canUseBaziReading(profile);
  const subActive = subscriptionActive(profile?.subscription_expires_at ?? null);
  const yearlySub = hasYearlySubscription(profile);

  return (
    <main
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink }}
    >
      {!online ? <COfflineBanner /> : null}
      <CLichSegmentedNav dark={false} />

      <div className="flex-1 overflow-y-auto px-[22px] pb-[100px] pt-[18px]">
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
            prevLabel={`‹ ${prevIso.slice(8, 10)}.${prevIso.slice(5, 7)} hôm qua`}
            nextLabel={`ngày mai ${nextIso.slice(8, 10)}.${nextIso.slice(5, 7)} ›`}
            onPrev={() => void navigate(`/ngay/${prevIso}`)}
            onNext={() => void navigate(`/ngay/${nextIso}`)}
            reasoning={
              offlineMode ? (
                <p
                  className="px-[18px] pb-3.5 font-serif text-xs italic leading-snug"
                  style={{ color: CT.muted }}
                >
                  Luận giải đầy đủ cần kết nối lại.
                </p>
              ) : (
                <CTodayReasoning
                  text={readingText}
                  fallbackText={inlineFallbackText || null}
                  loading={readingLoading}
                  instant={instantTyping}
                  onTypingComplete={markTypingSeen}
                  onCtaClick={() => void navigate(`/luan-ai/day-${todayIso}`)}
                />
              )
            }
          />
        ) : null}

        {today && !showRecomputeSkeleton && subActive ? (
          baziUnlocked ? (
            <Link
              to="/toi/luan-bat-tu"
              className="relative mt-[22px] block cursor-pointer border px-4 py-3.5 no-underline"
              style={{ background: "#fff", borderColor: CT.goldDeep, color: CT.ink }}
            >
              <div className="flex items-baseline gap-2">
                <span style={{ color: CT.goldDeep, fontSize: 14 }}>★</span>
                <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>
                  {yearlySub ? "Đã mở · gói năm" : "Đã mở"}
                </Mono>
              </div>
              <div
                className="mt-1.5 font-[family-name:var(--display)] text-[19px] font-extrabold uppercase tracking-[-0.01em]"
                style={{ color: CT.ink }}
              >
                Luận giải Bát tự năm
              </div>
              <div className="mt-1 font-serif text-xs" style={{ color: CT.muted }}>
                tính cách · vận năm · phong thuỷ · quý nhân
              </div>
              <div
                className="mt-2.5 font-[family-name:var(--display-2)] text-xs font-bold uppercase tracking-[0.06em]"
                style={{ color: CT.goldDeep }}
              >
                Đọc ngay →
              </div>
            </Link>
          ) : (
            <CMeLockedBaziCard />
          )
        ) : null}

        {offlineMode ? (
          <p
            className="mt-4 text-center font-serif text-xs italic leading-snug"
            style={{ color: CT.muted }}
          >
            Tra cứu, hợp tuổi, luận giải AI cần online — sẽ trở lại khi có mạng.
          </p>
        ) : null}
      </div>
    </main>
  );
}
