import { useMemo } from "react";
import { Link, useNavigate } from "react-router";

import { Mono } from "~/components/brand";
import { ErrorBanner } from "~/components/ErrorBanner";
import { CLichRecomputeSkeleton } from "~/components/direction-c/CLichRecomputeSkeleton";
import { CLichSegmentedNav } from "~/components/direction-c/CLichSegmentedNav";
import { CHomeBaziPreviewCard } from "~/components/direction-c/CHomeBaziPreviewCard";
import { CMeLockedTieuVanCard } from "~/components/direction-c/CMeLockedTieuVanCard";
import { CTodayReasoning } from "~/components/direction-c/CTodayReasoning";
import { LichToPageCard } from "~/components/direction-c/LichToPageCard";
import { COfflineBanner } from "~/components/direction-c/COfflineBanner";
import { useInlineDayReading } from "~/hooks/useInlineDayReading";
import { useLaSoRecomputeGate } from "~/hooks/useLaSoRecomputeGate";
import { useProfile } from "~/hooks/useProfile";
import { useTodayLichData } from "~/hooks/useTodayLichData";
import { useAuth } from "~/lib/auth";
import { currentYearVn } from "~/lib/bazi-reading-session";
import {
  canUseBaziReading,
  canUseCalendar,
  canUseTieuVanReading,
  hasYearlySubscription,
} from "~/lib/entitlements";
import { CT } from "~/lib/c-tokens";
import { TIEU_VAN_LUAN_ENABLED } from "~/lib/feature-flags";
import { buildCalendarLockedDayTeaser } from "~/lib/home-bat-tu";
import { parseDayDetailForView } from "~/lib/day-detail-view";
import { ngayHomNayToLichCard } from "~/lib/lich-format";
import {
  LUAN_LA_SO_BAT_TU_TAGLINE,
  LUAN_LA_SO_BAT_TU_TITLE,
} from "~/lib/luan-la-so-bat-tu-labels";
import {
  LUAN_LUU_NIEN_NGUYET_TAGLINE,
  LUAN_LUU_NIEN_NGUYET_TITLE,
} from "~/lib/luan-luu-nien-nguyet-labels";
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
    inlineReadingPayload,
    inlineReadingPending,
    online,
    todayIso,
    recomputePending: recomputePendingFromData,
    detailPayload,
    detailLoading,
  } = useTodayLichData();

  const showRecomputeSkeleton = recomputePending || recomputePendingFromData;
  const subActive = Boolean(profile && canUseCalendar(profile));
  const calendarLocked = Boolean(user && profile && !subActive);

  const dayEngineFallback = useMemo(() => {
    if (!calendarLocked || !detailPayload) return null;
    const detail = parseDayDetailForView(detailPayload);
    return detail ? buildCalendarLockedDayTeaser(detail) : null;
  }, [calendarLocked, detailPayload]);

  const {
    text: readingText,
    loading: readingLoading,
    failed: readingFailed,
    instantTyping,
    markTypingSeen,
  } = useInlineDayReading({
    iso: todayIso,
    endpoint: "ngay-hom-nay",
    batTuPayload: inlineReadingPayload,
    payloadPending: inlineReadingPending,
    enabled: Boolean(
      subActive && user && today && online && !showRecomputeSkeleton,
    ),
    subActive,
  });

  const inlineLuanPending =
    subActive && inlineReadingPending && !readingText?.trim();
  const showNlttLuanFailed =
    subActive &&
    Boolean(user && today && inlineReadingPayload) &&
    !inlineReadingPending &&
    !readingLoading &&
    readingFailed;
  const calendarTeaserPending =
    calendarLocked && detailLoading && !dayEngineFallback;
  const followUpPrompt =
    Boolean(user) &&
    !readingLoading &&
    !readingText?.trim() &&
    !dayEngineFallback &&
    !calendarTeaserPending &&
    !inlineLuanPending;
  const showTodayReasoning = Boolean(
    readingLoading ||
      readingText?.trim() ||
      dayEngineFallback ||
      calendarTeaserPending ||
      inlineLuanPending ||
      followUpPrompt,
  );

  const prevIso = addDaysToIso(todayIso, -1);
  const nextIso = addDaysToIso(todayIso, 1);
  const offlineMode = !online;
  const baziUnlocked = canUseBaziReading(profile);
  const tieuVanUnlocked = canUseTieuVanReading(profile);
  const yearlySub = hasYearlySubscription(profile);
  const tieuVanYear = currentYearVn();

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
            <Link to="/dang-ky" className="underline" style={{ color: CT.goldDeep }}>
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
            prevLabel={`${prevIso.slice(8, 10)}.${prevIso.slice(5, 7)} hôm qua`}
            nextLabel={`ngày mai ${nextIso.slice(8, 10)}.${nextIso.slice(5, 7)}`}
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
              ) : showNlttLuanFailed ? (
                <p
                  className="px-[18px] pb-3.5 font-serif text-sm italic leading-snug"
                  style={{ color: CT.muted }}
                >
                  Chưa tạo được luận giải NLTT cho hôm nay. Tải lại trang hoặc mở{" "}
                  <button
                    type="button"
                    className="cursor-pointer border-none bg-transparent p-0 font-serif italic underline"
                    style={{ color: CT.goldDeep }}
                    onClick={() => void navigate(`/luan-ai/day-${todayIso}`)}
                  >
                    luận chi tiết
                  </button>
                  .
                </p>
              ) : showTodayReasoning ? (
                <CTodayReasoning
                  text={readingText}
                  fallbackText={dayEngineFallback}
                  loading={
                    (readingLoading && subActive) ||
                    calendarTeaserPending ||
                    inlineLuanPending
                  }
                  instant={instantTyping}
                  onTypingComplete={markTypingSeen}
                  onCtaClick={() => void navigate(`/luan-ai/day-${todayIso}`)}
                  emptyPrompt={
                    followUpPrompt
                      ? "Bạn định làm việc cụ thể hôm nay? Hỏi NLTT xem ngày này có phù hợp không."
                      : undefined
                  }
                  showCta={Boolean(user)}
                  showCtaWithEngineFallback
                />
              ) : null
            }
          />
        ) : null}

        {today && !showRecomputeSkeleton && (subActive || calendarLocked) ? (
          baziUnlocked ? (
            <Link
              to="/toi/luan-bat-tu"
              className="relative mt-[22px] block cursor-pointer border px-4 py-3.5 no-underline"
              style={{ background: "#fff", borderColor: CT.goldDeep, color: CT.ink }}
            >
              <div className="flex items-baseline gap-2">
                <span style={{ color: CT.goldDeep, fontSize: 14.5 }}>★</span>
                <Mono style={{ color: CT.goldDeep, fontSize: 9.5 }}>
                  {yearlySub ? "Đã mở · gói năm" : "Đã mở"}
                </Mono>
              </div>
              <div
                className="mt-1.5 font-[family-name:var(--display)] text-[19.5px] font-extrabold uppercase tracking-[-0.01em]"
                style={{ color: CT.ink }}
              >
                {LUAN_LA_SO_BAT_TU_TITLE}
              </div>
              <div className="mt-1 font-serif text-xs" style={{ color: CT.muted }}>
                {LUAN_LA_SO_BAT_TU_TAGLINE}
              </div>
              <div
                className="mt-2.5 font-[family-name:var(--display-2)] text-xs font-bold uppercase tracking-[0.06em]"
                style={{ color: CT.goldDeep }}
              >
                Đọc ngay →
              </div>
            </Link>
          ) : (
            profile ? (
              <CHomeBaziPreviewCard profile={profile} />
            ) : null
          )
        ) : null}

        {TIEU_VAN_LUAN_ENABLED && today && !showRecomputeSkeleton && (subActive || calendarLocked) ? (
          tieuVanUnlocked && subActive ? (
            <Link
              to={`/toi/luan-tieu-van?year=${tieuVanYear}`}
              className="relative mt-[22px] block cursor-pointer border px-4 py-3.5 no-underline"
              style={{ background: "#fff", borderColor: CT.goldDeep, color: CT.ink }}
            >
              <div className="flex items-baseline gap-2">
                <span style={{ color: CT.goldDeep, fontSize: 14.5 }}>★</span>
                <Mono style={{ color: CT.goldDeep, fontSize: 9.5 }}>
                  {yearlySub ? "Đã mở · gói năm" : "Đã mở"}
                </Mono>
              </div>
              <div
                className="mt-1.5 font-[family-name:var(--display)] text-[19.5px] font-extrabold uppercase tracking-[-0.01em]"
                style={{ color: CT.ink }}
              >
                {LUAN_LUU_NIEN_NGUYET_TITLE} {tieuVanYear}
              </div>
              <div className="mt-1 font-serif text-xs" style={{ color: CT.muted }}>
                {LUAN_LUU_NIEN_NGUYET_TAGLINE}
              </div>
              <div
                className="mt-2.5 font-[family-name:var(--display-2)] text-xs font-bold uppercase tracking-[0.06em]"
                style={{ color: CT.goldDeep }}
              >
                Đọc ngay →
              </div>
            </Link>
          ) : (
            <CMeLockedTieuVanCard />
          )
        ) : null}

        {offlineMode ? (
          <p
            className="mt-4 text-center font-serif text-xs italic leading-snug"
            style={{ color: CT.muted }}
          >
            Tra cứu và luận giải AI cần online — sẽ trở lại khi có mạng.
          </p>
        ) : null}
      </div>
    </main>
  );
}
