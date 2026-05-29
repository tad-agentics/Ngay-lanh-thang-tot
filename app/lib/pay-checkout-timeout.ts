/** G3 — show CPayFailure inline after this long on màn 26/35. */
export const PAY_CHECKOUT_TIMEOUT_MS = 15 * 60 * 1000;

/** Match cron-payos-expire-orphans — pending orders older than this are not recoverable. */
export const PENDING_PAYMENT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Ignore brand-new pending orders (user still on confirm sheet). */
export const PENDING_PAYMENT_MIN_AGE_MS = 90 * 1000;

export const TERMINAL_PAYMENT_ORDER_STATUSES = new Set([
  "expired",
  "failed",
  "cancelled",
]);
