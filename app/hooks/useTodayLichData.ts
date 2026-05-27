import { useEffect, useState } from "react";

import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import {
  parseNgayHomNayForHome,
  type NgayHomNayHome,
} from "~/lib/home-bat-tu";
import { laSoJsonToRevealProps, profileHasLaso } from "~/lib/la-so-ui";
import { useEntitlements } from "~/hooks/useEntitlements";
import { useProfile } from "~/hooks/useProfile";
import { todayIsoInVn } from "~/lib/today-reading-cache";

export function useTodayLichData() {
  const { profile, loading: profileLoading } = useProfile();
  const { canUseCalendar } = useEntitlements();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState<NgayHomNayHome | null>(null);

  const laso = profile ? laSoJsonToRevealProps(profile.la_so) : null;
  const menh = laso?.menh ?? null;
  const canBatTu = Boolean(profileToBatTuPersonQuery(profile).birth_date);

  useEffect(() => {
    if (profileLoading) return;
    if (!canUseCalendar) {
      setLoading(false);
      setToday(null);
      setError(null);
      return;
    }
    if (!profile || !canBatTu) {
      setLoading(false);
      setToday(null);
      setError(profile && !canBatTu ? "Cần ngày sinh trên hồ sơ để mở lịch." : null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      const body = profileToBatTuPersonQuery(profile);
      const res = await invokeBatTu<unknown>({
        op: "ngay-hom-nay",
        body: { ...body, date: todayIsoInVn() },
      });
      if (cancelled) return;
      if (!res.ok) {
        setError(res.message ?? "Không tải được lịch hôm nay.");
        setToday(null);
      } else {
        setToday(parseNgayHomNayForHome(res.data));
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [profile, profileLoading, canBatTu, canUseCalendar]);

  return {
    profile,
    profileLoading,
    loading,
    error,
    today,
    menh,
    hasLaso: profile ? profileHasLaso(profile.la_so) : false,
    canBatTu,
  };
}
