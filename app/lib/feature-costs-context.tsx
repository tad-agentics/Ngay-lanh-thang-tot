import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Database } from "~/lib/database.types";
import { supabase } from "~/lib/supabase";

type CostRow = Database["public"]["Tables"]["feature_credit_costs"]["Row"];

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
  const [costs, setCosts] = useState<Record<string, CostRow>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadSeq, setReloadSeq] = useState(0);

  const reload = useCallback(() => {
    setReloadSeq((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: qe } = await supabase
          .from("feature_credit_costs")
          .select("*");
        if (cancelled) return;
        if (qe) {
          setError(qe.message);
          setCosts({});
        } else {
          setError(null);
          const rows: CostRow[] = (data ?? []) as CostRow[];
          const map: Record<string, CostRow> = {};
          for (const row of rows) map[row.feature_key] = row;
          setCosts(map);
        }
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof Error
            ? e.message
            : "Không tải được bảng giá lượng.",
        );
        setCosts({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadSeq]);

  const value = useMemo<FeatureCostsContextValue>(
    () => ({ costs, loading, error, reload }),
    [costs, loading, error, reload],
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
