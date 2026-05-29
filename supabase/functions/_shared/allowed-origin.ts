/**
 * App origin allowlist — must match Supabase secret ALLOWED_ORIGIN
 * (e.g. https://ngaylanhthangtot.vn). Used for PayOS return/cancel URLs.
 * CORS may fall back to "*"; redirect URLs never accept "*".
 */

/** Normalize ALLOWED_ORIGIN secret to a URL origin (scheme + host + port). */
export function normalizeAppOrigin(raw: string | null | undefined): string | null {
  const t = raw?.trim() ?? "";
  if (!t || t === "*") return null;
  try {
    return new URL(t).origin;
  } catch {
    return null;
  }
}

export function readAllowedAppOrigin(): string | null {
  return normalizeAppOrigin(Deno.env.get("ALLOWED_ORIGIN"));
}

/** PayOS return_url / cancel_url must be same origin as ALLOWED_ORIGIN. */
export function isRedirectUrlAllowed(
  redirectUrl: string,
  allowedOrigin: string | null,
): boolean {
  if (!allowedOrigin) return false;
  let u: URL;
  try {
    u = new URL(redirectUrl);
  } catch {
    return false;
  }
  if (u.username || u.password) return false;
  return u.origin === allowedOrigin;
}

export function isValidRedirectUrl(raw: string): boolean {
  return isRedirectUrlAllowed(raw, readAllowedAppOrigin());
}
