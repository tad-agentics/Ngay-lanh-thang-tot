import type { CreatePayosCheckoutResponse, PackageSku } from "~/lib/api-types";
import {
  PENDING_PAYMENT_MAX_AGE_MS,
  PENDING_PAYMENT_MIN_AGE_MS,
  TERMINAL_PAYMENT_ORDER_STATUSES,
} from "~/lib/pay-checkout-timeout";
import type { PendingPaymentFlow } from "~/lib/pending-payment-session";
import { paymentFlowForSku } from "~/lib/pending-payment-session";
import { ADDON_SKUS } from "~/lib/packages";

export type PaymentOrderRecoveryRow = {
  id: string;
  package_sku: string;
  status: string;
  checkout_url: string | null;
  amount_vnd: number | null;
  list_amount_vnd?: number | null;
  provider_order_code: string | null;
  raw_request: unknown;
  created_at: string;
};

export function isPaymentFlowExemptPath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (
    p === "/dat-lich/xac-nhan" ||
    p === "/thanh-cong" ||
    p === "/dat-lich/that-bai"
  ) {
    return true;
  }
  if (p === "/luan/mua/xac-nhan" || p.startsWith("/luan/mua/thanh-cong")) {
    return true;
  }
  if (p.startsWith("/luan/mua/that-bai")) return true;
  return false;
}

export function pendingOrderAgeMs(createdAt: string, now = Date.now()): number {
  const t = Date.parse(createdAt);
  if (!Number.isFinite(t)) return Number.POSITIVE_INFINITY;
  return now - t;
}

export function isRecoverablePendingOrder(
  row: { status: string; created_at: string },
  now = Date.now(),
): boolean {
  if (row.status !== "pending") return false;
  const age = pendingOrderAgeMs(row.created_at, now);
  return age >= PENDING_PAYMENT_MIN_AGE_MS && age < PENDING_PAYMENT_MAX_AGE_MS;
}

export function isTerminalPaymentStatus(status: string): boolean {
  return TERMINAL_PAYMENT_ORDER_STATUSES.has(status);
}

function parsePayosResponseTransfer(
  rawRequest: unknown,
  amountFallback: number,
  providerOrderCode: string | null,
): CreatePayosCheckoutResponse["transfer"] {
  if (!rawRequest || typeof rawRequest !== "object") return null;
  const response = (rawRequest as { response?: unknown }).response;
  if (!response || typeof response !== "object") return null;
  const data = (response as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  const hasTransfer =
    (typeof d.qrCode === "string" && d.qrCode.length > 0) ||
    (typeof d.accountNumber === "string" && d.accountNumber.length > 0);
  if (!hasTransfer) return null;

  const amountVnd =
    typeof d.amount === "number" && Number.isFinite(d.amount)
      ? d.amount
      : amountFallback;

  return {
    qr_code:
      typeof d.qrCode === "string" && d.qrCode.length > 0 ? d.qrCode : null,
    bank_bin: typeof d.bin === "string" ? d.bin : null,
    account_number:
      typeof d.accountNumber === "string" && d.accountNumber.length > 0
        ? d.accountNumber
        : null,
    account_name:
      typeof d.accountName === "string" && d.accountName.length > 0
        ? d.accountName
        : null,
    amount_vnd: amountVnd,
    transfer_content:
      typeof d.description === "string" && d.description.length > 0
        ? d.description
        : "",
    provider_order_code:
      typeof d.orderCode === "string" || typeof d.orderCode === "number"
        ? String(d.orderCode)
        : providerOrderCode ?? "",
  };
}

/** Rebuild checkout payload from `payment_orders` for recovery navigation. */
export function checkoutResponseFromOrder(
  row: PaymentOrderRecoveryRow,
): CreatePayosCheckoutResponse | null {
  const checkoutUrl = row.checkout_url?.trim();
  if (!checkoutUrl) return null;

  const amountFallback =
    typeof row.amount_vnd === "number" && Number.isFinite(row.amount_vnd)
      ? row.amount_vnd
      : 0;

  return {
    order_id: row.id,
    checkout_url: checkoutUrl,
    transfer: parsePayosResponseTransfer(
      row.raw_request,
      amountFallback,
      row.provider_order_code,
    ),
  };
}

export function recoverySuccessPath(
  flow: PendingPaymentFlow,
  packageSku: PackageSku,
  orderId: string,
): string {
  if (flow === "addon") {
    return `/luan/mua/thanh-cong?sku=${encodeURIComponent(packageSku)}&order_id=${encodeURIComponent(orderId)}`;
  }
  return `/thanh-cong?order_id=${encodeURIComponent(orderId)}`;
}

export function recoveryConfirmTarget(
  flow: PendingPaymentFlow,
  packageSku: PackageSku,
  checkout: CreatePayosCheckoutResponse,
): { pathname: string; search?: string; state: Record<string, unknown> } {
  if (flow === "addon") {
    return {
      pathname: "/luan/mua/xac-nhan",
      search: `?sku=${encodeURIComponent(packageSku)}`,
      state: { checkout },
    };
  }
  return {
    pathname: "/dat-lich/xac-nhan",
    state: { sku: packageSku, checkout },
  };
}

export function isAddonPackageSku(sku: string): sku is PackageSku {
  return ADDON_SKUS.includes(sku as PackageSku);
}

export function flowForPackageSku(sku: PackageSku): PendingPaymentFlow {
  return paymentFlowForSku(sku);
}
