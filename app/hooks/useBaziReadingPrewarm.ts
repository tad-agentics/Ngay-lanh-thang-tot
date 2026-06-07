import { useEffect } from "react";
import { useLocation } from "react-router";

import {
  cancelBaziReadingPrewarm,
  scheduleBaziPaywallTeaserPrewarm,
  scheduleBaziReadingPrewarm,
} from "~/lib/bazi-reading-prewarm";
import { currentYearVn } from "~/lib/bazi-reading-session";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { canUseBaziReading } from "~/lib/entitlements";
import type { Profile } from "~/lib/profile-context";

/** Nền sinh luận Bát Tự khi user đã unlock — trừ khi đang ở màn luận (loader riêng). */
export function useBaziReadingPrewarm(profile: Profile | null): void {
  const location = useLocation();
  const onLuanScreen = location.pathname === "/toi/luan-bat-tu";

  useEffect(() => {
    if (
      !profile ||
      !canUseBaziReading(profile) ||
      !profileToBatTuPersonQuery(profile).birth_date
    ) {
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

/** Nền làm ấm teaser Bát Tự cho non-buyer — bật trên `/toi` (xem route gate). */
export function useBaziPaywallTeaserPrewarm(profile: Profile | null): void {
  useEffect(() => {
    if (!profile) return;
    scheduleBaziPaywallTeaserPrewarm(profile);
  }, [
    profile,
    profile?.id,
    profile?.bazi_reading_unlocked_at,
    profile?.subscription_expires_at,
    profile?.ngay_sinh,
    profile?.gio_sinh,
  ]);
}
