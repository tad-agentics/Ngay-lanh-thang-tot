import { useMemo } from "react";

import type { PackageSku } from "~/lib/api-types";
import type { PaymentSuccessOrder } from "~/hooks/usePaymentSuccessOrder";
import {
  resolveOrderChargeAmounts,
  type OrderChargeAmounts,
} from "~/lib/payment-order-charge";
import { readPendingPayment } from "~/lib/pending-payment-session";

/**
 * Final/list VND for thank-you receipt + Meta picker (coupon-aware).
 * Uses `payment_orders` when loaded, else pending checkout session for same `order_id`.
 */
export function useOrderChargeAmounts(
  order: PaymentSuccessOrder | null,
  orderIdFromUrl: string | null,
): {
  sku: PackageSku | null;
  charge: OrderChargeAmounts | null;
} {
  return useMemo(() => {
    const trackingId = orderIdFromUrl ?? order?.id ?? null;
    const pending = readPendingPayment();
    const pendingMatch =
      pending && trackingId && pending.orderId === trackingId ? pending : null;
    const sku = order?.package_sku ?? pendingMatch?.packageSku ?? null;
    if (!sku) return { sku: null, charge: null };

    const charge = resolveOrderChargeAmounts({
      packageSku: sku,
      amountVnd: order?.amount_vnd,
      listAmountVnd: order?.list_amount_vnd,
      discountBreakdown: order?.discount_breakdown,
      pendingAmountVnd: pendingMatch?.amountVnd,
      pendingListAmountVnd: pendingMatch?.listAmountVnd,
    });

    return { sku, charge };
  }, [
    order?.id,
    order?.package_sku,
    order?.amount_vnd,
    order?.list_amount_vnd,
    order?.discount_breakdown,
    orderIdFromUrl,
  ]);
}
