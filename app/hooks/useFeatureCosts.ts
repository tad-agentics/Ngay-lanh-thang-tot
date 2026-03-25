import { useEffect, useState } from "react";

import type { Database } from "~/lib/database.types";
import { supabase } from "~/lib/supabase";

type CostRow = Database["public"]["Tables"]["feature_credit_costs"]["Row"];

export function useFeatureCosts(): {
  costs: Record<string, CostRow>;
  loading: boolean;
  error: string | null;
} {
  const [costs, setCosts] = useState<Record<string, CostRow>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("feature_credit_costs")
      .select("*")
      .then(({ data, error: qe }) => {
        if (cancelled) return;
        if (qe) setError(qe.message);
        else setError(null);
        const rows: CostRow[] = (data ?? []) as CostRow[];
        const map: Record<string, CostRow> = {};
        for (const row of rows) map[row.feature_key] = row;
        setCosts(map);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { costs, loading, error };
}
