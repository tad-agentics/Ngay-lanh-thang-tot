import { appendReturnToQuery } from "~/lib/pending-return-to";

/** Sign-up + birth profile (new accounts). */
export function buildLandingSignUpHref(referral?: string): string {
  return referral
    ? `/dang-ky?ref=${encodeURIComponent(referral)}`
    : "/dang-ky";
}

/** Returning users — login then land on calendar. */
export function buildLandingOpenCalendarHref(referral?: string): string {
  const base = referral
    ? `/dang-nhap?ref=${encodeURIComponent(referral)}`
    : "/dang-nhap";
  return appendReturnToQuery(base, "/lich");
}
