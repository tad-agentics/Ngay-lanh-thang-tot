import { useEffect, useState } from "react";

import type { PackageSku } from "~/lib/api-types";
import { supabase } from "~/lib/supabase";

export type PaymentSuccessOrder = {
  id: string;
  package_sku: PackageSku;
  amount_vnd: number | null;
  list_amount_vnd: number | null;
  discount_breakdown: unknown;
  status: string;
};

type Options = {
  /** Limit fallback lookup (subscription vs addon success pages). */
  packageSkus?: readonly PackageSku[];
};

/**
 * Load `payment_orders` for success screens: by `order_id` query, or latest paid
 * order for the user when PayOS return URL has no id.
 */
export function usePaymentSuccessOrder(
  orderIdFromUrl: string | null,
  userId: string | undefined,
  options?: Options,
) {
  const [order, setOrder] = useState<PaymentSuccessOrder | null>(null);
  const packageSkusKey = options?.packageSkus?.join(",") ?? "";

  useEffect(() => {
    let cancelled = false;

    async function loadById(id: string): Promise<PaymentSuccessOrder | null> {
      const { data } = await supabase
        .from("payment_orders")
        .select("id, package_sku, amount_vnd, list_amount_vnd, discount_breakdown, status")
        .eq("id", id)
        .maybeSingle();
      if (!data?.package_sku) return null;
      return data as PaymentSuccessOrder;
    }

    async function loadLatestPaid(): Promise<PaymentSuccessOrder | null> {
      if (!userId) return null;
      let q = supabase
        .from("payment_orders")
        .select("id, package_sku, amount_vnd, list_amount_vnd, discount_breakdown, status")
        .eq("user_id", userId)
        .eq("status", "paid")
        .order("created_at", { ascending: false })
        .limit(1);
      if (options?.packageSkus?.length) {
        q = q.in("package_sku", [...options.packageSkus]);
      }
      const { data } = await q.maybeSingle();
      if (!data?.package_sku) return null;
      return data as PaymentSuccessOrder;
    }

    void (async () => {
      setOrder(null);
      const row = orderIdFromUrl
        ? await loadById(orderIdFromUrl)
        : await loadLatestPaid();
      if (!cancelled) setOrder(row);
    })();

    return () => {
      cancelled = true;
    };
  }, [orderIdFromUrl, userId, packageSkusKey, options?.packageSkus]);

  const paid = order?.status === "paid";
  const trackingOrderId = orderIdFromUrl ?? order?.id ?? null;

  return { order, paid, trackingOrderId };
}
