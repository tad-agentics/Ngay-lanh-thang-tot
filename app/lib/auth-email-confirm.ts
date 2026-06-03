import type { EmailOtpType } from "@supabase/supabase-js";

import { authCallbackRedirectUrl } from "~/lib/auth-callback-url";
import { mapAuthErrorMessageVi } from "~/lib/auth-login-error";
import { supabase } from "~/lib/supabase";

const EMAIL_OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

export function parseEmailOtpType(raw: string | null): EmailOtpType | null {
  if (!raw) return null;
  return EMAIL_OTP_TYPES.includes(raw as EmailOtpType)
    ? (raw as EmailOtpType)
    : null;
}

/** Resend signup confirmation email (user has no session yet). */
export async function resendSignupConfirmationEmail(
  email: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const trimmed = email.trim();
  if (!trimmed) {
    return { ok: false, message: "Nhập email đã đăng ký." };
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: trimmed,
    options: { emailRedirectTo: authCallbackRedirectUrl() },
  });

  if (error) {
    return { ok: false, message: mapAuthErrorMessageVi(error.message) };
  }
  return { ok: true };
}
