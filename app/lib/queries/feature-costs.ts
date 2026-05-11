import type { Database } from "~/lib/database.types";
import { supabase } from "~/lib/supabase";

export type CostRow = Database["public"]["Tables"]["feature_credit_costs"]["Row"];

export async function fetchFeatureCreditCosts(): Promise<Record<string, CostRow>> {
  const { data, error } = await supabase.from("feature_credit_costs").select("*");
  if (error) {
    throw new Error(error.message);
  }
  const map: Record<string, CostRow> = {};
  for (const row of (data ?? []) as CostRow[]) {
    map[row.feature_key] = row;
  }
  return map;
}
