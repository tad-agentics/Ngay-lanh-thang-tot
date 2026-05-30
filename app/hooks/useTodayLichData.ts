import { useEffect, useState } from "react";

import { useOfflineCalendar } from "~/hooks/useOfflineCalendar";
import { useProfile } from "~/hooks/useProfile";
import { canUseCalendar, isNeverSubscribedUser } from "~/lib/entitlements";
import { useAuth } from "~/lib/auth";
import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import {
  mergeDayDetailScoreIntoHome,
  parseNgayHomNayForHome,
  type NgayHomNayHome,
} from "~/lib/home-bat-tu";
import { laSoJsonToRevealProps, profileHasLaso } from "~/lib/la-so-ui";
import { todayIsoInVn } from "~/lib/today-reading-cache";

export function useTodayLichData() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const todayIso = todayIsoInVn();
  const { online, readCached, writeCached } = useOfflineCalendar(
    user?.id,
    todayIso,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState<NgayHomNayHome | null>(null);
  const [rawPayload, setRawPayload] = useState<unknown | null>(null);

  const laso = profile ? laSoJsonToRevealProps(profile.la_so) : null;
  const menh = laso?.menh ?? null;
  const canBatTu = Boolean(profileToBatTuPersonQuery(profile).birth_date);

  useEffect(() => {
    if (profileLoading) return;
    if (
      profile &&
      !canUseCalendar(profile) &&
      !isNeverSubscribedUser(profile)
    ) {
      setLoading(false);
      setToday(null);
      setRawPayload(null);
      setError(null);
      return;
    }
    if (!profile || !canBatTu) {
      setLoading(false);
      setToday(null);
      setRawPayload(null);
      setError(profile && !canBatTu ? "Cần ngày sinh trên hồ sơ để mở lịch." : null);
      return;
    }

    if (profile.la_so_recompute_status === "pending") {
      setLoading(true);
      setToday(null);
      setRawPayload(null);
      setError(null);
      return;
    }

    if (!online) {
      const cached = readCached();
      setToday(cached);
      setRawPayload(null);
      setError(cached ? null : "Không có dữ liệu ngoại tuyến cho hôm nay.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      const body = profileToBatTuPersonQuery(profile);
      const [homNayRes, detailRes] = await Promise.all([
        invokeBatTu<unknown>({
          op: "ngay-hom-nay",
          body: { ...body, date: todayIso },
        }),
        invokeBatTu<unknown>({
          op: "day-detail",
          body: { ...body, date: todayIso },
        }),
      ]);
      if (cancelled) return;
      if (!homNayRes.ok) {
        setError(homNayRes.message ?? "Không tải được lịch hôm nay.");
        setToday(null);
        setRawPayload(null);
      } else {
        let parsed = parseNgayHomNayForHome(homNayRes.data);
        if (parsed && detailRes.ok) {
          parsed = mergeDayDetailScoreIntoHome(parsed, detailRes.data);
        }
        setToday(parsed);
        setRawPayload(homNayRes.data);
        if (parsed) writeCached(parsed);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    profile,
    profileLoading,
    canBatTu,
    online,
    readCached,
    writeCached,
    todayIso,
  ]);

  const recomputePending = profile?.la_so_recompute_status === "pending";

  return {
    profile,
    profileLoading,
    loading,
    error,
    today,
    rawPayload,
    menh,
    scoreMethodology: today?.scoreMethodology ?? null,
    hasLaso: profile ? profileHasLaso(profile.la_so) : false,
    canBatTu,
    online,
    todayIso,
    recomputePending,
  };
}
