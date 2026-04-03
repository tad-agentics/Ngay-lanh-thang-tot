import type { QueryClient } from "@tanstack/react-query";

import { fetchFeatureCreditCosts } from "~/lib/queries/feature-costs";
import { queryKeys } from "~/lib/query-keys";
import { fetchSiteBannerFromDb } from "~/lib/site-banner";

/** Warm cache trước khi user vào màn (bottom nav hover / sheet). */
export function prefetchCoreAppQueries(queryClient: QueryClient): void {
  void queryClient.prefetchQuery({
    queryKey: queryKeys.featureCreditCosts(),
    queryFn: fetchFeatureCreditCosts,
  });
  void queryClient.prefetchQuery({
    queryKey: queryKeys.siteBanner(),
    queryFn: fetchSiteBannerFromDb,
  });
}
