import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { hashBatTuBody, useBatTuQuery } from "~/hooks/useBatTuQuery";
import { useOfflineCalendar } from "~/hooks/useOfflineCalendar";
import { useProfile } from "~/hooks/useProfile";
import { canUseCalendar, isNeverSubscribedUser } from "~/lib/entitlements";
import { useAuth } from "~/lib/auth";
import { profileCanUseBatTu, profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import {
  mergeDayDetailScoreIntoHome,
  parseNgayHomNayForHome,
  type NgayHomNayHome,
} from "~/lib/home-bat-tu";
import { laSoJsonToRevealProps, profileHasLaso } from "~/lib/la-so-ui";
import { queryKeys } from "~/lib/query-keys";
import {
  readTodayHomeSession,
  todayIsoInVn,
} from "~/lib/today-reading-cache";

export function useTodayLichData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { profile, loading: profileLoading } = useProfile();
  const todayIso = todayIsoInVn();
  const { online, readCached, writeCached } = useOfflineCalendar(
    user?.id,
    todayIso,
  );

  const laso = profile ? laSoJsonToRevealProps(profile.la_so) : null;
  const menh = laso?.menh ?? null;
  const canBatTu = profileCanUseBatTu(profile);
  const recomputePending = profile?.la_so_recompute_status === "pending";

  const lapsedNoCalendar =
    Boolean(profile) &&
    !canUseCalendar(profile!) &&
    !isNeverSubscribedUser(profile!);

  const batTuBody = useMemo(() => {
    if (!profile || !canBatTu) return null;
    return { ...profileToBatTuPersonQuery(profile), date: todayIso };
  }, [profile, canBatTu, todayIso]);

  const bodyHash = batTuBody ? hashBatTuBody(batTuBody) : "";
  const userId = user?.id;

  const bootstrapToday = useMemo((): NgayHomNayHome | null => {
    if (!userId) return null;
    const fromSession = readTodayHomeSession(userId, todayIso);
    if (fromSession) return fromSession;
    return (
      queryClient.getQueryData<NgayHomNayHome>(
        queryKeys.todayLich(userId, todayIso),
      ) ?? null
    );
  }, [userId, todayIso, queryClient]);

  const fetchEnabled =
    Boolean(userId && batTuBody && online && !recomputePending && !lapsedNoCalendar);

  const homNayQuery = useBatTuQuery<unknown>(userId, "ngay-hom-nay", batTuBody ?? {}, {
    enabled: fetchEnabled,
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
    if (homNayData == null) return bootstrapToday;
    let parsed = parseNgayHomNayForHome(homNayData);
    if (parsed && detailData != null) {
      parsed = mergeDayDetailScoreIntoHome(parsed, detailData);
    }
    return parsed;
  }, [homNayData, detailData, bootstrapToday]);

  const readingPayload =
    luanData ?? detailData ?? homNayData ?? null;

  useEffect(() => {
    if (!mergedToday || !userId) return;
    writeCached(mergedToday);
    queryClient.setQueryData(
      queryKeys.todayLich(userId, todayIso),
      mergedToday,
    );
  }, [mergedToday, userId, todayIso, writeCached, queryClient]);

  const offlineToday = !online ? readCached() : null;

  let error: string | null = null;
  if (profile && !canBatTu) {
    error = "Hoàn tất lập lá số (ngày sinh và canh giờ) để mở lịch.";
  } else if (!online && !offlineToday) {
    error = "Không có dữ liệu ngoại tuyến cho hôm nay.";
  } else if (homNayQuery.isError) {
    error = homNayQuery.error?.message ?? "Không tải được lịch hôm nay.";
  }

  const loading =
    profileLoading ||
    recomputePending ||
    (fetchEnabled &&
      homNayQuery.isPending &&
      !bootstrapToday &&
      !offlineToday);

  const today = !online ? offlineToday : mergedToday;

  return {
    profile,
    profileLoading,
    loading,
    error,
    today,
    rawPayload: homNayData ?? null,
    readingPayload,
    menh,
    scoreMethodology: today?.scoreMethodology ?? null,
    hasLaso: profile ? profileHasLaso(profile.la_so) : false,
    canBatTu,
    online,
    todayIso,
    recomputePending,
  };
}
