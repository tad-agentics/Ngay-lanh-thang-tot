import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import type { BatTuOperation } from "~/lib/api-types";
import { invokeBatTu } from "~/lib/bat-tu";
import { queryKeys } from "~/lib/query-keys";
import { APP_QUERY_STALE_TIME_MS } from "~/lib/query-client";

export function hashBatTuBody(body: Record<string, unknown>): string {
  return JSON.stringify(body);
}

type BatTuQueryOptions<T> = Omit<
  UseQueryOptions<T, Error, T, readonly unknown[]>,
  "queryKey" | "queryFn"
>;

export function useBatTuQuery<T>(
  userId: string | undefined,
  op: BatTuOperation,
  body: Record<string, unknown>,
  options?: BatTuQueryOptions<T>,
) {
  const bodyHash = hashBatTuBody(body);
  const enabled = Boolean(userId) && (options?.enabled ?? true);

  return useQuery({
    queryKey: queryKeys.batTu(userId ?? "", op, bodyHash),
    queryFn: async () => {
      const res = await invokeBatTu<T>({ op, body });
      if (!res.ok) throw new Error(res.message ?? `bat-tu ${op} failed`);
      return res.data as T;
    },
    staleTime: APP_QUERY_STALE_TIME_MS,
    enabled,
    ...options,
  });
}
