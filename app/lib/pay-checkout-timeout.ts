/** G3 — show CPayFailure inline after this long on màn 26/35. */
export const PAY_CHECKOUT_TIMEOUT_MS = 15 * 60 * 1000;

export const TERMINAL_PAYMENT_ORDER_STATUSES = new Set([
  "expired",
  "failed",
  "cancelled",
]);
