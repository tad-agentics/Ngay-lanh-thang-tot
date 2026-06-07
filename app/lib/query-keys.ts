/** Central query keys for TanStack Query (prefetch + invalidate). */
export const queryKeys = {
  root: ["ngaytot"] as const,
  siteBanner: () => [...queryKeys.root, "site-banner"] as const,
  /** G1 — invalidate all months after lá số recompute. */
  lichThangRoot: (userId: string) =>
    [...queryKeys.root, "lich-thang", userId] as const,
  lichThang: (userId: string, monthKey: string) =>
    [...queryKeys.lichThangRoot(userId), monthKey] as const,
  batTuRoot: (userId: string) =>
    [...queryKeys.root, "bat-tu", userId] as const,
  batTu: (userId: string, op: string, bodyHash: string) =>
    [...queryKeys.batTuRoot(userId), op, bodyHash] as const,
  todayLich: (userId: string, dateIso: string) =>
    [...queryKeys.root, "today-lich", userId, dateIso] as const,
};
