/**
 * Direction B nav config — 5-cell bottom nav: home / month / (FAB) / lookup / me.
 * BottomNav is visible on all tab roots + the chọn ngày flow.
 */

/** Routes where BottomNav is visible */
const NAV_PATHS = new Set([
  "/app",
  "/app/chon-ngay",
  "/app/chon-ngay/ket-qua",
  "/app/thang",
  "/app/tra-cuu",
  "/app/toi",
  // Legacy tab routes that still exist until fully reskinned in waves 4-5
  "/app/van-thang",
  "/app/la-so",
  "/app/la-so/chi-tiet",
  "/app/hop-tuoi",
  "/app/phong-thuy",
]);

function normalizePath(pathname: string): string {
  if (pathname === "/" || pathname === "") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

export function shouldShowNav(pathname: string): boolean {
  return NAV_PATHS.has(normalizePath(pathname));
}

export type BottomNavTab = "home" | "month" | "lookup" | "me";

export function getActiveTab(pathname: string): BottomNavTab | null {
  const p = normalizePath(pathname);
  if (p === "/app") return "home";
  if (p === "/app/thang") return "month";
  if (p === "/app/chon-ngay" || p === "/app/chon-ngay/ket-qua") return null;
  if (p === "/app/tra-cuu") return "lookup";
  if (p === "/app/toi") return "me";
  // Legacy routes (to be retired in waves 4-5)
  if (["/app/la-so", "/app/la-so/chi-tiet", "/app/van-thang", "/app/hop-tuoi", "/app/phong-thuy"].includes(p)) {
    return "lookup";
  }
  return null;
}

/** Map tab id to its canonical route */
export const TAB_ROUTES: Record<BottomNavTab, string> = {
  home: "/app",
  month: "/app/thang",
  lookup: "/app/tra-cuu",
  me: "/app/toi",
};
