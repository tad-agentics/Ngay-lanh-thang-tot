/** Central query keys for TanStack Query (prefetch + invalidate). */
export const queryKeys = {
  root: ["ngaytot"] as const,
  featureCreditCosts: () => [...queryKeys.root, "feature-credit-costs"] as const,
  siteBanner: () => [...queryKeys.root, "site-banner"] as const,
};
