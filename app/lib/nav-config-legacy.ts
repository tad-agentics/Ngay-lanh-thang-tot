/** Direction B legacy 5-tab nav — `/app/*` shell only. */

export type LegacyBottomNavTab = "home" | "month" | "lookup" | "me";

const LEGACY_NAV_PATHS = new Set([
  "/app",
  "/app/home",
  "/app/hom-nay",
  "/app/thang",
  "/app/tra-cuu",
  "/app/toi",
]);

function normalizePath(pathname: string): string {
  if (pathname === "/" || pathname === "") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

export function shouldShowLegacyNav(pathname: string): boolean {
  return LEGACY_NAV_PATHS.has(normalizePath(pathname));
}

export function getLegacyActiveTab(pathname: string): LegacyBottomNavTab | null {
  const p = normalizePath(pathname);
  if (p === "/app" || p === "/app/home" || p === "/app/hom-nay") return "home";
  if (p === "/app/thang") return "month";
  if (p === "/app/tra-cuu") return "lookup";
  if (p === "/app/toi") return "me";
  return null;
}

export const LEGACY_TAB_ROUTES: Record<LegacyBottomNavTab, string> = {
  home: "/app",
  month: "/app/thang",
  lookup: "/app/tra-cuu",
  me: "/app/toi",
};
