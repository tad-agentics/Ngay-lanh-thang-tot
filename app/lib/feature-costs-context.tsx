import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import { queryKeys } from "~/lib/query-keys";
import {
  fetchFeatureCreditCosts,
  type CostRow,
} from "~/lib/queries/feature-costs";

export type { CostRow };

export type FeatureCostsContextValue = {
  costs: Record<string, CostRow>;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

const FeatureCostsContext = createContext<FeatureCostsContextValue | null>(
  null,
);

export function FeatureCostsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isPending, isError, error } = useQuery({
    queryKey: queryKeys.featureCreditCosts(),
    queryFn: fetchFeatureCreditCosts,
  });

  const reload = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.featureCreditCosts(),
    });
  }, [queryClient]);

  const costs = data ?? {};
  const loading = isPending;
  const errMsg = isError
    ? error instanceof Error
      ? error.message
      : "Không tải được bảng giá lượng."
    : null;

  const value = useMemo<FeatureCostsContextValue>(
    () => ({
      costs,
      loading,
      error: errMsg,
      reload,
    }),
    [costs, loading, errMsg, reload],
  );

  return (
    <FeatureCostsContext.Provider value={value}>
      {children}
    </FeatureCostsContext.Provider>
  );
}

export function useFeatureCosts(): FeatureCostsContextValue {
  const ctx = useContext(FeatureCostsContext);
  if (!ctx) {
    throw new Error(
      "useFeatureCosts must be used within FeatureCostsProvider",
    );
  }
  return ctx;
}
