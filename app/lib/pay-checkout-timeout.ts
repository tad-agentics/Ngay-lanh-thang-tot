/**
 * G3 — checkout window (FE countdown + recovery).
 * Keep in sync with `supabase/functions/_shared/pay-checkout-timeout.ts`.
 */
export const PAY_CHECKOUT_TIMEOUT_MS = 5 * 60 * 1000;

/** `mm:ss` for checkout countdown UI. */
export function formatCheckoutCountdownMs(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** Match `payment_orders.expires_at` / cron-payos-expire-orphans — not recoverable after this. */
export const PENDING_PAYMENT_MAX_AGE_MS = PAY_CHECKOUT_TIMEOUT_MS;

/** Ignore brand-new pending orders (user still on confirm sheet). */
export const PENDING_PAYMENT_MIN_AGE_MS = 90 * 1000;

export const TERMINAL_PAYMENT_ORDER_STATUSES = new Set([
  "expired",
  "failed",
  "cancelled",
]);
