import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "~/lib/query-keys";
import { clearLichThangCachesForUser } from "~/lib/lich-thang-cache";

export const LA_SO_RECOMPUTED_EVENT = "ngaytot:la-so-recomputed";

const USER_SESSION_PREFIXES = (userId: string) =>
  [
    `ngaytot_today_home:${userId}:`,
    `ngaytot_today_ai_reading:${userId}:`,
    `bazi-reading-ai:${userId}`,
  ] as const;

/** G1 — drop stale session caches tied to old lá số / readings. */
export function clearUserReadingSessionCaches(userId: string): void {
  if (typeof sessionStorage === "undefined") return;
  const prefixes = USER_SESSION_PREFIXES(userId);
  const keys: string[] = [];
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i);
    if (key && prefixes.some((p) => key.startsWith(p))) keys.push(key);
  }
  for (const key of keys) sessionStorage.removeItem(key);
}

/** G1 — invalidate FE caches after lá số recompute completes. */
export function invalidateLaSoRecomputeCaches(
  userId: string,
  queryClient?: QueryClient,
): void {
  clearUserReadingSessionCaches(userId);
  clearLichThangCachesForUser(userId);
  if (queryClient) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.lichThangRoot(userId),
    });
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(LA_SO_RECOMPUTED_EVENT));
    window.dispatchEvent(new Event("ngaytot:profile-refresh"));
  }
}
