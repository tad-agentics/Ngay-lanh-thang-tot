import { useEffect } from "react";
import { useLocation } from "react-router";

import {
  cancelVanTrinhNamPrewarm,
  scheduleVanTrinhNamPrewarm,
} from "~/lib/van-trinh-nam-prewarm";
import { currentYearVn } from "~/lib/van-trinh-nam-session";
import { canUseTieuVanReading } from "~/lib/entitlements";
import { profileHasLaso } from "~/lib/la-so-ui";
import type { Profile } from "~/lib/profile-context";

/** Nền sinh luận lưu niên khi user đã unlock — trừ khi đang ở màn luận. */
export function useVanTrinhNamPrewarm(profile: Profile | null): void {
  const location = useLocation();
  const onScreen = location.pathname === "/toi/luan-tieu-van";

  useEffect(() => {
    if (!profile || !canUseTieuVanReading(profile) || !profileHasLaso(profile.la_so)) {
      return;
    }
    const year = currentYearVn();
    if (onScreen) {
      cancelVanTrinhNamPrewarm(profile, year);
      return;
    }
    scheduleVanTrinhNamPrewarm(profile, {
      year,
      skipWhenScreenLoading: onScreen,
    });
  }, [
    profile,
    profile?.id,
    profile?.tieu_van_reading_expires_at,
    profile?.subscription_expires_at,
    profile?.ngay_sinh,
    profile?.gio_sinh,
    onScreen,
  ]);
}
