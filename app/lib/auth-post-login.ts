import {
  destinationAfterAuthFromProfile,
  type PostLoginProfile,
} from "~/lib/pending-return-to";
import { tryConsumePendingReferralClaim } from "~/lib/referral-claim";
import { supabase } from "~/lib/supabase";

/**
 * Resolve post-login route from session + profile (email, Google OAuth, callback).
 * Consumes `sessionStorage` referral (OAuth / email login) via Edge `referral-claim`.
 */
export async function resolvePostLoginPath(): Promise<string> {
  const { data: sessionData, error } = await supabase.auth.getSession();
  const session = sessionData.session;
  const uid = session?.user?.id;
  if (error || !uid) return "/dang-nhap";

  await tryConsumePendingReferralClaim(session);

  const { data: prof } = await supabase
    .from("profiles")
    .select("onboarding_completed_at, ngay_sinh, gio_sinh, gioi_tinh")
    .eq("id", uid)
    .maybeSingle();

  return destinationAfterAuthFromProfile(prof as PostLoginProfile | null);
}

/**
 * PKCE callback helper for `/auth/callback` (Google OAuth + email confirm).
 *
 * Supabase client uses `detectSessionInUrl: true`, which may exchange `?code=`
 * before this runs. Treat an existing session as success; after a failed manual
 * exchange, re-check session before surfacing an error.
 */
export async function exchangeOAuthCodeFromUrl(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const {
    data: { session: existing },
    error: sessionReadError,
  } = await supabase.auth.getSession();
  if (sessionReadError) return sessionReadError.message;
  if (existing) return null;

  const code = new URLSearchParams(window.location.search).get("code");
  if (!code) return null;

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (!error) return null;

  const {
    data: { session: afterRace },
    error: retryReadError,
  } = await supabase.auth.getSession();
  if (retryReadError) return retryReadError.message;
  if (afterRace) return null;

  return error.message;
}
