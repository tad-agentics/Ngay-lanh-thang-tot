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

    void (async () => {
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
  }, []);

  return { costs, loading, error };
}
