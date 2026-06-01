import { useMemo } from "react";

import {
  canUseCalendar,
  formatSubscriptionExpiry,
  isSubscriptionLapsed,
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
      isExpired: isSubscriptionLapsed(profile),
      expiresAt: profile?.subscription_expires_at ?? null,
      expiryFormatted: formatSubscriptionExpiry(
        profile?.subscription_expires_at,
      ),
      statusLine: subscriptionStatusLine(profile),
    }),
    [profile, loading, error, reload],
  );
}
