/** Direction C N7 — install banner dismiss, hidden 30 days. */

export const INSTALL_BANNER_DISMISSED_KEY = "install_banner_dismissed_at";

const LEGACY_DISMISSED_KEY = "ngaytot:install-banner-dismissed";

const HIDE_MS = 30 * 24 * 60 * 60 * 1000;

function readDismissedAt(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(INSTALL_BANNER_DISMISSED_KEY);
  if (raw) {
    const t = Date.parse(raw);
    if (Number.isFinite(t)) return t;
  }
  if (window.localStorage.getItem(LEGACY_DISMISSED_KEY) === "1") {
    const now = new Date().toISOString();
    window.localStorage.setItem(INSTALL_BANNER_DISMISSED_KEY, now);
    window.localStorage.removeItem(LEGACY_DISMISSED_KEY);
    return Date.parse(now);
  }
  return null;
}

export function isInstallBannerDismissed(): boolean {
  const at = readDismissedAt();
  if (at == null) return false;
  return Date.now() - at < HIDE_MS;
}

export function dismissInstallBanner(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    INSTALL_BANNER_DISMISSED_KEY,
    new Date().toISOString(),
  );
  window.localStorage.removeItem(LEGACY_DISMISSED_KEY);
}
