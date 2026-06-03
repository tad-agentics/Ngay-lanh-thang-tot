import type { PackageSku } from "~/lib/api-types";
import { PACKAGE_AMOUNT_VND } from "~/lib/package-amount-vnd";

export type OrderChargeAmounts = {
  /** Final charge (VND) — PayOS / `payment_orders.amount_vnd`. */
  finalVnd: number;
  listVnd: number | null;
  hasDiscount: boolean;
};

function positiveInt(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return null;
  return Math.round(v);
}

/** `payment_orders.discount_breakdown` JSON from checkout RPC. */
export function parseOrderDiscountBreakdown(raw: unknown): {
  list_amount_vnd: number;
  amount_vnd: number;
  coupon_discount_vnd?: number;
  referral_discount_vnd?: number;
} | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const list = positiveInt(o.list_amount_vnd);
  const amount = positiveInt(o.amount_vnd);
  if (list == null || amount == null) return null;
  return {
    list_amount_vnd: list,
    amount_vnd: amount,
    coupon_discount_vnd: positiveInt(o.coupon_discount_vnd) ?? undefined,
    referral_discount_vnd: positiveInt(o.referral_discount_vnd) ?? undefined,
  };
}

export type ResolveOrderChargeInput = {
  packageSku: PackageSku;
  amountVnd?: number | null;
  listAmountVnd?: number | null;
  discountBreakdown?: unknown;
  /** From `pending-payment` session right after checkout (coupon quote). */
  pendingAmountVnd?: number | null;
  pendingListAmountVnd?: number | null;
};

/**
 * Resolves list vs final charge for receipts and Meta (`#meta-purchase-value`).
 * Prefers paid/final columns — never substitutes catalog price when a discounted
 * `amount_vnd` or breakdown exists.
 */
export function resolveOrderChargeAmounts(
  input: ResolveOrderChargeInput,
): OrderChargeAmounts | null {
  const breakdown = parseOrderDiscountBreakdown(input.discountBreakdown);

  const finalVnd =
    positiveInt(input.amountVnd) ??
    (breakdown ? breakdown.amount_vnd : null) ??
    positiveInt(input.pendingAmountVnd);

  const listVnd =
    positiveInt(input.listAmountVnd) ??
    (breakdown ? breakdown.list_amount_vnd : null) ??
    positiveInt(input.pendingListAmountVnd);

  if (finalVnd == null) {
    const catalog = PACKAGE_AMOUNT_VND[input.packageSku];
    if (!(catalog > 0)) return null;
    return {
      finalVnd: catalog,
      listVnd: listVnd,
      hasDiscount: listVnd != null && catalog < listVnd,
    };
  }

  const list =
    listVnd ??
    (finalVnd < PACKAGE_AMOUNT_VND[input.packageSku]
      ? PACKAGE_AMOUNT_VND[input.packageSku]
      : null);

  return {
    finalVnd,
    listVnd: list,
    hasDiscount: list != null && finalVnd < list,
  };
}
