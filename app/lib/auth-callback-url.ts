/** OAuth + email-confirm redirect — must match Supabase Auth URL allow list. */

export function authCallbackRedirectUrl(): string {
  if (typeof window === "undefined") {
    return "/auth/callback";
  }
  return `${window.location.origin}/auth/callback`;
}
