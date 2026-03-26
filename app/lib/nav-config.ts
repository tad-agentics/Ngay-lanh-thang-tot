/** Routes where BottomNav is visible (tab roots + chọn ngày flow + khám phá màn chọn) — parity with Make `nav-config.ts`. */
const NAV_PATHS = new Set([
  "/app",
  "/app/chon-ngay",
  "/app/chon-ngay/ket-qua",
  "/app/cai-dat",
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

export type BottomNavTab = "lich" | "chon-ngay" | "kham-pha" | "cai-dat";

export function getActiveTab(pathname: string): BottomNavTab | null {
  const p = normalizePath(pathname);
  if (p === "/app") return "lich";
  if (p === "/app/chon-ngay" || p === "/app/chon-ngay/ket-qua") return "chon-ngay";
  if (p === "/app/cai-dat") return "cai-dat";
  if (
    [
      "/app/la-so",
      "/app/la-so/chi-tiet",
      "/app/van-thang",
      "/app/hop-tuoi",
      "/app/phong-thuy",
    ].includes(p)
  ) {
    return "kham-pha";
  }
  return null;
}
