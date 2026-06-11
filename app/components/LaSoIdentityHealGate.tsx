import { useLaSoIdentityHeal } from "~/hooks/useLaSoIdentityHeal";
import { useProfile } from "~/hooks/useProfile";

/** Side-effect only — recompute stale `profiles.la_so` in background. */
export function LaSoIdentityHealGate() {
  const { profile, loading } = useProfile();
  useLaSoIdentityHeal(profile, loading);
  return null;
}
