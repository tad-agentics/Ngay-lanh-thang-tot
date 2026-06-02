export const MARKETING_CONSENT_STORAGE_KEY = "ngaytot:marketing_consent";

export const MARKETING_CONSENT_CHANGED_EVENT = "ngaytot:marketing-consent";

export type MarketingConsent = "granted" | "denied";

export function readMarketingConsent(): MarketingConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MARKETING_CONSENT_STORAGE_KEY);
    if (raw === "granted" || raw === "denied") return raw;
  } catch {
    /* private mode */
  }
  return null;
}

export function writeMarketingConsent(choice: MarketingConsent): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MARKETING_CONSENT_STORAGE_KEY, choice);
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event(MARKETING_CONSENT_CHANGED_EVENT));
}

export function hasMarketingConsentChoice(): boolean {
  return readMarketingConsent() != null;
}
