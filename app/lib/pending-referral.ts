/** Session-only storage for OAuth signup path (Edge `referral-claim`). */
export const PENDING_REFERRAL_STORAGE_KEY = "ngaytot_pending_referral";

export function readPendingReferralCode(): string | null {
  try {
    const v = sessionStorage.getItem(PENDING_REFERRAL_STORAGE_KEY)?.trim();
    return v && v.length > 0 ? v.toUpperCase() : null;
  } catch {
    return null;
  }
}

export function stashPendingReferralCode(raw: string | null | undefined): void {
  const t = raw?.trim();
  if (!t) return;
  try {
    sessionStorage.setItem(PENDING_REFERRAL_STORAGE_KEY, t.toUpperCase());
  } catch {
    /* private mode / quota */
  }
}

export function clearPendingReferralCode(): void {
  try {
    sessionStorage.removeItem(PENDING_REFERRAL_STORAGE_KEY);
  } catch {
    /* */
  }
}

export function referralParamFromSearchParams(
  searchParams: URLSearchParams,
): string {
  return (
    searchParams.get("ref")?.trim() ||
    searchParams.get("referral")?.trim() ||
    ""
  );
}
