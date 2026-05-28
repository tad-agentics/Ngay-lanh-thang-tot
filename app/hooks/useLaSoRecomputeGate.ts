import { useQueryClient } from "@tanstack/react-query";

import { usePollLaSoRecompute } from "~/hooks/usePollLaSoRecompute";
import { useProfile } from "~/hooks/useProfile";
import { invalidateLaSoRecomputeCaches } from "~/lib/la-so-recompute-invalidate";

type Options = {
  onReady?: () => void | Promise<void>;
  onFailed?: () => void | Promise<void>;
};

/** G1 — poll recompute + invalidate caches when ready. */
export function useLaSoRecomputeGate(options: Options = {}) {
  const { profile, reload } = useProfile();
  const queryClient = useQueryClient();

  usePollLaSoRecompute(profile?.id, profile?.la_so_recompute_status, {
    onReady: async () => {
      await reload();
      if (profile?.id) {
        invalidateLaSoRecomputeCaches(profile.id, queryClient);
      }
      await options.onReady?.();
    },
    onFailed: options.onFailed,
  });

  return {
    pending: profile?.la_so_recompute_status === "pending",
    failed: profile?.la_so_recompute_status === "failed",
  };
}
