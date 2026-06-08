import { clearBaziPaywallTeaserLocalAll } from "~/lib/bazi-reading-session";
import { markSessionExpired } from "~/lib/auth-session-redirect";
import { supabase } from "~/lib/supabase";

/** Auth errors where local session should be cleared and user sent to login. */
export function isStaleAuthSessionError(
  message: string | undefined | null,
): boolean {
  if (!message) return false;
  return /jwt|expired|invalid.*token|refresh token not found/i.test(message);
}

/** Drop broken local session without calling server revoke (refresh token already gone). */
export async function clearStaleAuthSession(): Promise<void> {
  markSessionExpired();
  clearBaziPaywallTeaserLocalAll();
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // Best-effort — stale refresh may already prevent server sign-out.
  }
}
