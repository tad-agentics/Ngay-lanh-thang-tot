import { useEffect, useState } from "react";

import type { PackageSku } from "~/lib/api-types";
import { SUBSCRIPTION_SKUS } from "~/lib/packages";
import { supabase } from "~/lib/supabase";

const VALID = new Set<string>(SUBSCRIPTION_SKUS);

/** G2 — last paid subscription tier for renew pre-select on CSubExpired. */
export function useLastPaidSubscriptionSku(
  userId: string | null | undefined,
): PackageSku | null {
  const [sku, setSku] = useState<PackageSku | null>(null);

  useEffect(() => {
    if (!userId) {
      setSku(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("payment_orders")
        .select("package_sku")
        .eq("user_id", userId)
        .eq("status", "paid")
        .in("package_sku", [...SUBSCRIPTION_SKUS])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      const next = data?.package_sku;
      setSku(next && VALID.has(next) ? (next as PackageSku) : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return sku;
}
