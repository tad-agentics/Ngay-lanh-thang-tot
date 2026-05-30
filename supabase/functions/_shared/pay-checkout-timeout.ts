/** G3 — checkout window; keep in sync with `app/lib/pay-checkout-timeout.ts`. */
export const PAY_CHECKOUT_TIMEOUT_MS = 5 * 60 * 1000;

export const PAY_CHECKOUT_TIMEOUT_SEC = Math.ceil(
  PAY_CHECKOUT_TIMEOUT_MS / 1000,
);

export function payCheckoutExpiresAtIso(fromMs = Date.now()): string {
  return new Date(fromMs + PAY_CHECKOUT_TIMEOUT_MS).toISOString();
}

/** PayOS `expiredAt` — Unix seconds (Int32). */
export function payCheckoutExpiredAtUnix(fromMs = Date.now()): number {
  return Math.floor((fromMs + PAY_CHECKOUT_TIMEOUT_MS) / 1000);
}
