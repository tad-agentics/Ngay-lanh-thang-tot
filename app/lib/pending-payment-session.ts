import type { PackageSku } from "~/lib/api-types";
import { ADDON_SKUS } from "~/lib/packages";

const STORAGE_KEY = "ngaytot:pending-payment:v1";

export type PendingPaymentFlow = "subscription" | "addon";

export type PendingPaymentSession = {
  orderId: string;
  packageSku: PackageSku;
  flow: PendingPaymentFlow;
  checkoutUrl: string;
  createdAt: string;
};

export function paymentFlowForSku(sku: PackageSku): PendingPaymentFlow {
  return ADDON_SKUS.includes(sku) ? "addon" : "subscription";
}

export function stashPendingPayment(session: PendingPaymentSession): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* quota / private mode */
  }
}

export function readPendingPayment(): PendingPaymentSession | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingPaymentSession;
    if (
      !parsed ||
      typeof parsed.orderId !== "string" ||
      typeof parsed.packageSku !== "string" ||
      typeof parsed.checkoutUrl !== "string" ||
      typeof parsed.createdAt !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingPayment(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
