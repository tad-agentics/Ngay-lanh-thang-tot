/** Route gates for background work (prewarm, saved picks). */

import { TIEU_VAN_LUAN_ENABLED } from "~/lib/feature-flags";

export function routeUsesBaziPrewarm(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p === "/toi/luan-bat-tu" || p.startsWith("/toi/luan-bat-tu/")) {
    return true;
  }
  if (
    TIEU_VAN_LUAN_ENABLED &&
    (p === "/toi/luan-tieu-van" || p.startsWith("/toi/luan-tieu-van/"))
  ) {
    return true;
  }
  if (p.startsWith("/luan")) return true;
  return false;
}

export function routeUsesVanTrinhNamPrewarm(pathname: string): boolean {
  if (!TIEU_VAN_LUAN_ENABLED) return false;
  const p = pathname.replace(/\/+$/, "") || "/";
  return p === "/toi/luan-tieu-van" || p.startsWith("/toi/luan-tieu-van/");
}

export function routeUsesSavedPicks(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p === "/toi" || p.startsWith("/toi/")) return true;
  if (p.startsWith("/ngay/")) return true;
  if (p === "/tra-cuu/hop-tuoi/ket-qua") return true;
  return false;
}
