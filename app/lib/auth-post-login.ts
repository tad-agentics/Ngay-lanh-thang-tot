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

/** PKCE OAuth — exchange ?code= before reading session on /auth/callback. */
export async function exchangeOAuthCodeFromUrl(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (!code) return null;

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return error?.message ?? null;
}
