/**
 * Direction C nav — 3-tab: Lịch · Tra cứu · Tôi
 */

export type BottomNavTab = "lich" | "tra-cuu" | "toi";

const NAV_PATHS = new Set([
  "/lich",
  "/lich/thang",
  "/tra-cuu",
  "/tra-cuu/hop-tuoi",
  "/toi",
]);

function normalizePath(pathname: string): string {
  if (pathname === "/" || pathname === "") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

export function shouldShowNav(pathname: string): boolean {
  return NAV_PATHS.has(normalizePath(pathname));
}

export function getActiveTab(pathname: string): BottomNavTab | null {
  const p = normalizePath(pathname);
  if (p === "/lich" || p === "/lich/thang") return "lich";
  if (p === "/tra-cuu" || p === "/tra-cuu/hop-tuoi") return "tra-cuu";
  if (p === "/toi") return "toi";
  return null;
}

export const TAB_ROUTES: Record<BottomNavTab, string> = {
  lich: "/lich",
  "tra-cuu": "/tra-cuu",
  toi: "/toi",
};

/** Paths allowed while onboarding is incomplete (purchase + first-run). */
export const ONBOARDING_EXEMPT_PATHS = new Set([
  "/gio-sinh",
  "/dang-dung-lich",
  "/lich-da-mo",
  "/dat-lich",
  "/dat-lich/xac-nhan",
  "/dat-lich/that-bai",
  "/thanh-cong",
  "/luan/mua/xac-nhan",
  "/luan/mua/thanh-cong",
  "/luan/mua/that-bai",
]);

export function isOnboardingExemptPath(pathname: string): boolean {
  return ONBOARDING_EXEMPT_PATHS.has(normalizePath(pathname));
}

/** Allowed when subscription expired — renew, addon checkout, account, offline. */
export const SUBSCRIPTION_EXEMPT_PATHS = new Set([
  ...ONBOARDING_EXEMPT_PATHS,
  "/toi/cai-dat",
  "/toi/gioi-thieu",
  "/toi/sua-ho-so",
  "/offline",
]);

/** Lịch + chi tiết ngày + luận ngày — teaser khi chưa gói hoặc hết hạn (luận bị blur). */
export function isCalendarBrowsePath(pathname: string): boolean {
  const p = normalizePath(pathname);
  if (p === "/lich" || p.startsWith("/lich/")) return true;
  if (p.startsWith("/ngay/")) return true;
  if (p.startsWith("/luan-ai/day-")) return true;
  return false;
}

export function isSubscriptionExemptPath(pathname: string): boolean {
  const p = normalizePath(pathname);
  if (SUBSCRIPTION_EXEMPT_PATHS.has(p)) return true;
  if (p.startsWith("/luan/mua/")) return true;
  return false;
}

const RETURN_TO_ALLOW = /^\/(lich|tra-cuu|ngay\/[\d-]+|dat-lich)(\/|$)/;

export function sanitizeReturnTo(raw: string | null): string | null {
  if (!raw || raw.length > 200) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  if (!RETURN_TO_ALLOW.test(raw)) return null;
  return raw;
}

/** Legacy /app/* → Direction C paths (302 during transition). */
export const LEGACY_APP_REDIRECTS: Record<string, string> = {
  "/app": "/lich",
  "/app/hom-nay": "/lich",
  "/app/home": "/lich",
  "/app/thang": "/lich/thang",
  "/app/tra-cuu": "/tra-cuu",
  "/app/chon-ngay": "/tra-cuu",
  "/app/chon-ngay/ket-qua": "/tra-cuu/ket-qua",
  "/app/hop-tuoi": "/tra-cuu/hop-tuoi",
  "/app/toi": "/toi",
  "/app/mua-luong": "/dat-lich",
  "/app/mua-luong/thanh-cong": "/thanh-cong",
  "/app/cai-dat": "/toi/cai-dat",
  "/app/cai-dat-app": "/toi/cai-dat",
  "/app/ngay": "/ngay",
  "/app/bat-dau": "/dang-ky",
  "/app/chuyen-lich": "/toi",
  "/app/la-so": "/toi/la-so",
  "/app/la-so/chi-tiet": "/toi/la-so",
  "/app/tieu-van": "/toi/luan-tieu-van",
  "/app/phong-thuy": "/lich",
  "/tien-ich/phong-thuy": "/lich",
  "/tra-cuu/dang-tim": "/tra-cuu",
  "/app/so-viec": "/toi",
  "/app/chia-se": "/tra-cuu",
  "/app/nhip/lich-su": "/lich",
  "/app/nhip/cai-dat": "/toi/cai-dat",
  "/app/van-thang": "/lich/thang",
  "/app/lich-thang": "/lich/thang",
};

export function legacyAppRedirect(pathname: string): string | null {
  const p = normalizePath(pathname);
  if (LEGACY_APP_REDIRECTS[p]) return LEGACY_APP_REDIRECTS[p];
  if (p.startsWith("/app/ngay/")) {
    return p.replace("/app/ngay/", "/ngay/");
  }
  if (p.startsWith("/app/")) {
    return "/lich";
  }
  return null;
}
