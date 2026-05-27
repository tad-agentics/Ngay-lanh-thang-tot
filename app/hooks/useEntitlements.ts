import { useMemo } from "react";

import {
  canUseBaziReading,
  canUseCalendar,
  canUseTieuVanReading,
} from "~/lib/entitlements";
import { useProfile } from "~/hooks/useProfile";

export function useEntitlements() {
  const { profile, loading, error, reload } = useProfile();

  return useMemo(
    () => ({
      profile,
      loading,
      error,
      reload,
      canUseCalendar: canUseCalendar(profile),
      canUseBaziReading: canUseBaziReading(profile),
      canUseTieuVanReading: canUseTieuVanReading(profile),
    }),
    [profile, loading, error, reload],
  );
}
