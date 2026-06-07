import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useBatTuQuery } from "~/hooks/useBatTuQuery";
import { useOfflineCalendar } from "~/hooks/useOfflineCalendar";
import { useProfile } from "~/hooks/useProfile";
import { useAuth } from "~/lib/auth";
import { profileCanUseBatTu, profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { canUseCalendar } from "~/lib/entitlements";
import {
  buildCalendarLockedDayTeaser,
  mergeDayDetailScoreIntoHome,
  parseNgayHomNayForHome,
  pickDayDetailInlineLuanFallback,
  type NgayHomNayHome,
} from "~/lib/home-bat-tu";
import {
  parseDayDetailForView,
  type DayDetailViewModel,
} from "~/lib/day-detail-view";
import { laSoJsonToRevealProps } from "~/lib/la-so-ui";
import { ngayHomNayToLichCard } from "~/lib/lich-format";
import { queryKeys } from "~/lib/query-keys";
import { readTodayHomeSession, todayIsoInVn } from "~/lib/today-reading-cache";
import { resolveInlineReadingPayload } from "~/lib/today-inline-reading-payload";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeLichDayIso(raw: string | null, fallback: string): string {
  const t = (raw ?? "").trim().slice(0, 10);
  return ISO_DAY.test(t) ? t : fallback;
}

export function useLichDayData(iso: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { profile, loading: profileLoading } = useProfile();
  const todayIso = todayIsoInVn();
  const isToday = iso === todayIso;
  const userId = user?.id;

  const { online, readCached } = useOfflineCalendar(userId, todayIso);

  const canBatTu = profileCanUseBatTu(profile);
  const recomputePending = profile?.la_so_recompute_status === "pending";
  const subActive = Boolean(profile && canUseCalendar(profile));
  const calendarLocked = Boolean(user && profile && !subActive);
  const personalized = Boolean(
    profile && profileToBatTuPersonQuery(profile).birth_date,
  );
  const menh = profile ? laSoJsonToRevealProps(profile.la_so)?.menh ?? null : null;

  const batTuBody = useMemo(() => {
    if (!profile || !canBatTu) return null;
    return { ...profileToBatTuPersonQuery(profile), date: iso };
  }, [profile, canBatTu, iso]);

  const fetchEnabled =
    Boolean(userId && batTuBody && online && !recomputePending);

  const bootstrapToday = useMemo((): NgayHomNayHome | null => {
    if (!isToday || !userId) return null;
    const fromSession = readTodayHomeSession(userId, todayIso);
    if (fromSession) return fromSession;
    return (
      queryClient.getQueryData<NgayHomNayHome>(
        queryKeys.todayLich(userId, todayIso),
      ) ?? null
    );
  }, [isToday, userId, todayIso, queryClient]);

  const homNayQuery = useBatTuQuery<unknown>(userId, "ngay-hom-nay", batTuBody ?? {}, {
    enabled: fetchEnabled && isToday,
  });
  const detailQuery = useBatTuQuery<unknown>(userId, "day-detail", batTuBody ?? {}, {
    enabled: fetchEnabled,
  });
  const luanQuery = useBatTuQuery<unknown>(
    userId,
    "day-luan-context",
    batTuBody ?? {},
    { enabled: fetchEnabled },
  );

  const homNayData = homNayQuery.data;
  const detailData = detailQuery.data;
  const luanData = luanQuery.data;

  const mergedToday = useMemo((): NgayHomNayHome | null => {
    if (!isToday) return null;
    if (homNayData == null) return bootstrapToday;
    let parsed = parseNgayHomNayForHome(homNayData);
    if (parsed && detailData != null) {
      parsed = mergeDayDetailScoreIntoHome(parsed, detailData);
    }
    return parsed;
  }, [isToday, homNayData, detailData, bootstrapToday]);

  const detail = useMemo((): DayDetailViewModel | null => {
    if (detailData == null) return null;
    return parseDayDetailForView(detailData);
  }, [detailData]);

  const { payload: inlineReadingPayload, pending: inlineReadingPending } =
    useMemo(
      () =>
        resolveInlineReadingPayload({
          fetchEnabled,
          luanPending: fetchEnabled && luanQuery.isPending,
          luanData,
          detailData,
          homNayData: isToday ? homNayData : null,
        }),
      [
        fetchEnabled,
        luanQuery.isPending,
        luanData,
        detailData,
        homNayData,
        isToday,
      ],
    );

  const offlineToday = isToday && !online ? readCached() : null;
  const todayHome = !online && isToday ? offlineToday : mergedToday;

  const cardFromToday = useMemo(() => {
    if (!isToday || !todayHome) return null;
    return ngayHomNayToLichCard(todayHome, menh, iso);
  }, [isToday, todayHome, menh, iso]);

  const hasCachedDayView = Boolean(cardFromToday || detailData != null);

  const dayEngineFallback = useMemo(() => {
    if (isToday && calendarLocked && detail) {
      return buildCalendarLockedDayTeaser(detail);
    }
    if (!isToday && detail && !subActive) {
      return calendarLocked
        ? buildCalendarLockedDayTeaser(detail)
        : pickDayDetailInlineLuanFallback(detail) || null;
    }
    return null;
  }, [calendarLocked, detail, isToday, subActive]);

  let error: string | null = null;
  if (profile && !canBatTu) {
    error = "Hoàn tất lập lá số (ngày sinh và canh giờ) để mở lịch.";
  } else if (isToday && !online && !offlineToday) {
    error = "Không có dữ liệu ngoại tuyến cho hôm nay.";
  } else if (
    !isToday &&
    !online &&
    canBatTu &&
    userId &&
    !hasCachedDayView
  ) {
    error = "Chi tiết ngày này cần mạng — khi offline chỉ xem được hôm nay.";
  } else if (isToday && homNayQuery.isError) {
    error = homNayQuery.error?.message ?? "Không tải được lịch hôm nay.";
  } else if (detailQuery.isError) {
    error = detailQuery.error?.message ?? "Không tải được chi tiết ngày.";
  }

  const loading =
    profileLoading ||
    recomputePending ||
    (fetchEnabled &&
      ((isToday &&
        homNayQuery.isPending &&
        !bootstrapToday &&
        !offlineToday) ||
        (detailQuery.isPending && detail == null && !cardFromToday)));

  const detailLoading =
    fetchEnabled && detailQuery.isPending && detailData == null;

  const ready = Boolean(cardFromToday || detail);

  return {
    iso,
    todayIso,
    isToday,
    user,
    canBatTu,
    subActive,
    calendarLocked,
    personalized,
    online,
    menh,
    cardFromToday,
    detail,
    detailData,
    homNayData,
    inlineReadingPayload,
    inlineReadingPending,
    dayEngineFallback,
    detailLoading,
    loading,
    error,
    recomputePending,
    ready,
  };
}

export type LichDayData = ReturnType<typeof useLichDayData>;
