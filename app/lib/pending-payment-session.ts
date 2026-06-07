import type { PackageSku } from "~/lib/api-types";
import { ALL_ADDON_SKUS } from "~/lib/packages";

const STORAGE_KEY = "ngaytot:pending-payment:v1";
const DISMISS_KEY = "ngaytot:pending-payment-dismiss:v1";

export type PendingPaymentFlow = "subscription" | "addon";

export type PendingPaymentSession = {
  orderId: string;
  packageSku: PackageSku;
  flow: PendingPaymentFlow;
  checkoutUrl: string;
  createdAt: string;
  /** Final charge after coupon/referral (for thank-you / Meta before poll). */
  amountVnd?: number;
  listAmountVnd?: number;
};

export function paymentFlowForSku(sku: PackageSku): PendingPaymentFlow {
  return ALL_ADDON_SKUS.includes(sku) ? "addon" : "subscription";
}

export function stashPendingPayment(session: PendingPaymentSession): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    const prev = readPendingPayment();
    if (prev?.orderId !== session.orderId) {
      clearPendingPaymentBannerDismiss();
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* quota / private mode */
  }
}

/** Hide recovery banner for this order until paid, terminal, or a new checkout. */
export function dismissPendingPaymentBanner(orderId: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(DISMISS_KEY, orderId);
  } catch {
    /* ignore */
  }
}

export function isPendingPaymentBannerDismissed(orderId: string): boolean {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(DISMISS_KEY) === orderId;
  } catch {
    return false;
  }
}

export function clearPendingPaymentBannerDismiss(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(DISMISS_KEY);
  } catch {
    /* ignore */
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
    const amountVnd =
      typeof parsed.amountVnd === "number" && Number.isFinite(parsed.amountVnd)
        ? Math.round(parsed.amountVnd)
        : undefined;
    const listAmountVnd =
      typeof parsed.listAmountVnd === "number" &&
      Number.isFinite(parsed.listAmountVnd)
        ? Math.round(parsed.listAmountVnd)
        : undefined;
    return { ...parsed, amountVnd, listAmountVnd };
  } catch {
    return null;
  }
}

export function clearPendingPayment(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(DISMISS_KEY);
  } catch {
    /* ignore */
  }
}
