import type { EmailOtpType } from "@supabase/supabase-js";

import { syncSignupBirthMetadataToProfile } from "~/lib/auth-birth-sync";
import { parseEmailOtpType } from "~/lib/auth-email-confirm";
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

  if (session.user) {
    await syncSignupBirthMetadataToProfile(session.user);
  }

  const { data: prof } = await supabase
    .from("profiles")
    .select("onboarding_completed_at, ngay_sinh, gio_sinh, gioi_tinh")
    .eq("id", uid)
    .maybeSingle();

  return destinationAfterAuthFromProfile(prof as PostLoginProfile | null);
}

async function readSessionOrError(): Promise<{
  session: Awaited<
    ReturnType<typeof supabase.auth.getSession>
  >["data"]["session"];
  errorMessage: string | null;
}> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) return { session: null, errorMessage: error.message };
  return { session, errorMessage: null };
}

async function verifyEmailOtpFromUrl(
  tokenHash: string,
  type: EmailOtpType,
): Promise<string | null> {
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });
  if (!error) return null;

  const { session, errorMessage } = await readSessionOrError();
  if (errorMessage) return errorMessage;
  if (session) return null;

  return error.message;
}

async function exchangePkceCodeFromUrl(code: string): Promise<string | null> {
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (!error) return null;

  const { session, errorMessage } = await readSessionOrError();
  if (errorMessage) return errorMessage;
  if (session) return null;

  return error.message;
}

/** Let `detectSessionInUrl` parse hash / pending client state before PKCE exchange. */
function waitForAuthClientUrlParse(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

/**
 * `/auth/callback` — Google OAuth, email confirm (`?code=`), and PKCE signup
 * (`?token_hash=&type=signup`). `detectSessionInUrl` may finish first; always
 * re-check session before returning an error.
 */
export async function completeAuthCallbackFromUrl(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const initial = await readSessionOrError();
  if (initial.errorMessage) return initial.errorMessage;
  if (initial.session) return null;

  const params = new URLSearchParams(window.location.search);
  const tokenHash = params.get("token_hash");
  const otpType = parseEmailOtpType(params.get("type"));

  if (tokenHash && !otpType) {
    return "Link xác nhận không hợp lệ. Vào đăng nhập email và chọn Gửi lại email xác nhận.";
  }

  if (tokenHash && otpType) {
    const otpError = await verifyEmailOtpFromUrl(tokenHash, otpType);
    if (otpError) return otpError;
    const afterOtp = await readSessionOrError();
    if (afterOtp.errorMessage) return afterOtp.errorMessage;
    if (afterOtp.session) return null;
  }

  await waitForAuthClientUrlParse();
  const afterDetect = await readSessionOrError();
  if (afterDetect.errorMessage) return afterDetect.errorMessage;
  if (afterDetect.session) return null;

  const code = params.get("code");
  if (code) {
    return exchangePkceCodeFromUrl(code);
  }

  return null;
}

/** @deprecated Use `completeAuthCallbackFromUrl` — kept for tests. */
export async function exchangeOAuthCodeFromUrl(): Promise<string | null> {
  return completeAuthCallbackFromUrl();
}
