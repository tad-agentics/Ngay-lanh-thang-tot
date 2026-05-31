import { useEffect } from "react";
import { useLocation } from "react-router";

import {
  cancelBaziReadingPrewarm,
  scheduleBaziReadingPrewarm,
} from "~/lib/bazi-reading-prewarm";
import { currentYearVn } from "~/lib/bazi-reading-session";
import { canUseBaziReading } from "~/lib/entitlements";
import { profileHasLaso } from "~/lib/la-so-ui";
import type { Profile } from "~/lib/profile-context";

/** Nền sinh luận Bát Tự khi user đã unlock — trừ khi đang ở màn luận (loader riêng). */
export function useBaziReadingPrewarm(profile: Profile | null): void {
  const location = useLocation();
  const onLuanScreen = location.pathname === "/toi/luan-bat-tu";

  useEffect(() => {
    if (!profile || !canUseBaziReading(profile) || !profileHasLaso(profile.la_so)) {
      return;
    }
    const year = currentYearVn();
    if (onLuanScreen) {
      cancelBaziReadingPrewarm(profile, year);
      return;
    }
    scheduleBaziReadingPrewarm(profile, {
      year,
      skipWhenScreenLoading: onLuanScreen,
    });
  }, [
    profile,
    profile?.id,
    profile?.bazi_reading_unlocked_at,
    profile?.subscription_expires_at,
    profile?.ngay_sinh,
    profile?.gio_sinh,
    onLuanScreen,
  ]);
}
