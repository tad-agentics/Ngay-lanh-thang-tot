import { useMemo } from "react";

import {
  canUseCalendar,
  formatSubscriptionExpiry,
  subscriptionActive,
  subscriptionStatusLine,
} from "~/lib/entitlements";
import { useProfile } from "~/hooks/useProfile";

export function useSubscription() {
  const { profile, loading, error, reload } = useProfile();

  return useMemo(
    () => ({
      profile,
      loading,
      error,
      reload,
      isActive: canUseCalendar(profile),
      isExpired:
        profile != null &&
        !subscriptionActive(profile.subscription_expires_at),
      expiresAt: profile?.subscription_expires_at ?? null,
      expiryFormatted: formatSubscriptionExpiry(
        profile?.subscription_expires_at,
      ),
      statusLine: subscriptionStatusLine(profile),
    }),
    [profile, loading, error, reload],
  );
}
