import { supabase } from "~/lib/supabase";

/**
 * Access token cho `functions.invoke` (header Authorization: Bearer).
 * Làm mới session nếu access token sắp hết hạn.
 */
export async function getAccessTokenForEdgeInvoke(): Promise<string | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session?.access_token) return null;

  const exp = session.expires_at;
  const expMs = typeof exp === "number" ? exp * 1000 : 0;
  if (expMs > 0 && expMs < Date.now() + 120_000) {
    const { data: refreshed, error: refErr } =
      await supabase.auth.refreshSession();
    if (!refErr && refreshed.session?.access_token) {
      return refreshed.session.access_token;
    }
  }

  return session.access_token;
}
