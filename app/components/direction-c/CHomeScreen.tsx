import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { Mono } from "~/components/brand";
import { ErrorBanner } from "~/components/ErrorBanner";
import { CLichDayMonthDivider } from "~/components/direction-c/CLichDayMonthDivider";
import { CLichMonthCalendarSection } from "~/components/direction-c/CLichMonthCalendarSection";
import { CLichRecomputeSkeleton } from "~/components/direction-c/CLichRecomputeSkeleton";
import { CMeLockedTieuVanCard } from "~/components/direction-c/CMeLockedTieuVanCard";
import { LichSelectedDayCard } from "~/components/direction-c/LichSelectedDayCard";
import { COfflineBanner } from "~/components/direction-c/COfflineBanner";
import { useLaSoRecomputeGate } from "~/hooks/useLaSoRecomputeGate";
import {
  normalizeLichDayIso,
  useLichDayData,
} from "~/hooks/useLichDayData";
import { useLichThangData } from "~/hooks/useLichThangData";
import { useProfile } from "~/hooks/useProfile";
import { useAuth } from "~/lib/auth";
import { currentYearVn } from "~/lib/bazi-reading-session";
import {
  canAccessPaidCalendar,
  canUseCalendar,
  canUseTieuVanReading,
  hasYearlySubscription,
} from "~/lib/entitlements";
import { CT } from "~/lib/c-tokens";
import { TIEU_VAN_LUAN_ENABLED } from "~/lib/feature-flags";
import {
  applyLichCalendarParams,
  hasValidLichNgayParam,
  resolveLichViewYm,
  ymFromIso,
} from "~/lib/lich-day-url";
import {
  LUAN_LUU_NIEN_NGUYET_TAGLINE,
  LUAN_LUU_NIEN_NGUYET_TITLE,
} from "~/lib/luan-luu-nien-nguyet-labels";
import { todayIsoInVn } from "~/lib/today-reading-cache";

export function CHomeScreen() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { pending: recomputePending } = useLaSoRecomputeGate();
  const [searchParams, setSearchParams] = useSearchParams();

  const todayIso = todayIsoInVn();
  const selectedIso = normalizeLichDayIso(searchParams.get("ngay"), todayIso);
  const dayCardRef = useRef<HTMLDivElement>(null);

  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");
  const ngayParam = searchParams.get("ngay");
  const hasNgayParam = hasValidLichNgayParam(ngayParam);

  const [viewYm, setViewYm] = useState(() =>
    resolveLichViewYm(selectedIso, yearParam, monthParam, hasNgayParam),
  );

  useEffect(() => {
    setViewYm(resolveLichViewYm(selectedIso, yearParam, monthParam, hasNgayParam));
  }, [yearParam, monthParam, selectedIso, hasNgayParam]);

  useEffect(() => {
    if (!hasNgayParam) return;
    const ym = ymFromIso(selectedIso);
    if (yearParam === String(ym.year) && monthParam === String(ym.month)) return;
    setSearchParams(
      applyLichCalendarParams(searchParams, {
        iso: selectedIso,
        year: ym.year,
        month: ym.month,
        todayIso,
      }),
      { replace: true },
    );
  }, [
    hasNgayParam,
    selectedIso,
    yearParam,
    monthParam,
    searchParams,
    setSearchParams,
    todayIso,
  ]);

  const setSelectedIso = useCallback(
    (iso: string) => {
      const ym = ymFromIso(iso);
      setViewYm(ym);
      setSearchParams(
        applyLichCalendarParams(searchParams, {
          iso,
          year: ym.year,
          month: ym.month,
          todayIso,
        }),
        { replace: true },
      );
      window.requestAnimationFrame(() => {
        dayCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    [searchParams, setSearchParams, todayIso],
  );

  const shiftMonth = useCallback(
    (delta: number) => {
      let m = viewYm.month + delta;
      let y = viewYm.year;
      if (m < 1) {
        m = 12;
        y -= 1;
      } else if (m > 12) {
        m = 1;
        y += 1;
      }
      const ym = { year: y, month: m };
      setViewYm(ym);
      setSearchParams(
        applyLichCalendarParams(searchParams, { year: y, month: m }),
        { replace: true },
      );
    },
    [viewYm, searchParams, setSearchParams],
  );

  const dayData = useLichDayData(selectedIso);

  const {
    canBatTu,
    online,
    loading: dayLoading,
    error: dayError,
    recomputePending: dayRecomputePending,
    ready: dayReady,
    subActive,
  } = dayData;

  const monthThang = useLichThangData({
    profile,
    profileLoading,
    year: viewYm.year,
    month: viewYm.month,
    online,
  });

  const showRecomputeSkeleton = recomputePending || dayRecomputePending;
  const tieuVanUnlocked = canUseTieuVanReading(profile);
  const yearlySub = hasYearlySubscription(profile);
  const tieuVanYear = currentYearVn();
  const calendarLockedView = Boolean(
    user && profile && !canAccessPaidCalendar(profile),
  );

  const showDayBlock = useMemo(
    () => dayReady || dayLoading,
    [dayReady, dayLoading],
  );

  return (
    <main
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink }}
    >
      {!online ? <COfflineBanner /> : null}

      <div className="flex-1 overflow-y-auto px-[22px] pb-[100px] pt-[18px]">
        {dayError ? <ErrorBanner message={dayError} /> : null}
        {!canBatTu && !profileLoading && !dayLoading ? (
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

        {dayLoading && !showRecomputeSkeleton ? (
          <p
            className="py-12 text-center font-serif text-sm"
            style={{ color: CT.muted }}
          >
            Đang tải ngày…
          </p>
        ) : null}

        {showRecomputeSkeleton ? <CLichRecomputeSkeleton variant="page" /> : null}

        {showDayBlock && !showRecomputeSkeleton ? (
          <div ref={dayCardRef}>
            <LichSelectedDayCard iso={selectedIso} dayData={dayData} />
          </div>
        ) : null}

        {showDayBlock && canBatTu && !showRecomputeSkeleton ? (
          <CLichDayMonthDivider />
        ) : null}

        {canBatTu && !showRecomputeSkeleton ? (
          <CLichMonthCalendarSection
            year={viewYm.year}
            month={viewYm.month}
            todayIso={todayIso}
            selectedIso={selectedIso}
            monthThang={monthThang}
            onShiftMonth={shiftMonth}
            onSelectDay={setSelectedIso}
          />
        ) : null}

        {TIEU_VAN_LUAN_ENABLED &&
        showDayBlock &&
        !showRecomputeSkeleton &&
        (subActive || calendarLockedView) ? (
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

        {!online ? (
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
