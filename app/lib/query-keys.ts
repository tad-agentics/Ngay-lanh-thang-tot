/** Central query keys for TanStack Query (prefetch + invalidate). */
export const queryKeys = {
  root: ["ngaytot"] as const,
  featureCreditCosts: () => [...queryKeys.root, "feature-credit-costs"] as const,
  siteBanner: () => [...queryKeys.root, "site-banner"] as const,
  /** G1 — invalidate all months after lá số recompute. */
  lichThangRoot: (userId: string) =>
    [...queryKeys.root, "lich-thang", userId] as const,
  lichThang: (userId: string, monthKey: string) =>
    [...queryKeys.lichThangRoot(userId), monthKey] as const,
};
