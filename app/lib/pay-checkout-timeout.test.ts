import { describe, expect, it } from "vitest";

import {
  formatCheckoutCountdownMs,
  PAY_CHECKOUT_TIMEOUT_MS,
  PENDING_PAYMENT_MAX_AGE_MS,
  TERMINAL_PAYMENT_ORDER_STATUSES,
} from "./pay-checkout-timeout";

describe("pay-checkout-timeout", () => {
  it("uses 5 minute checkout window (G3)", () => {
    expect(PAY_CHECKOUT_TIMEOUT_MS).toBe(5 * 60 * 1000);
  });

  it("recovery max age matches checkout window", () => {
    expect(PENDING_PAYMENT_MAX_AGE_MS).toBe(PAY_CHECKOUT_TIMEOUT_MS);
  });

  it("formats countdown as mm:ss", () => {
    expect(formatCheckoutCountdownMs(5 * 60 * 1000)).toBe("05:00");
    expect(formatCheckoutCountdownMs(90_500)).toBe("01:31");
    expect(formatCheckoutCountdownMs(0)).toBe("00:00");
  });

  it("treats expired/failed/cancelled as terminal poll states", () => {
    expect(TERMINAL_PAYMENT_ORDER_STATUSES.has("expired")).toBe(true);
    expect(TERMINAL_PAYMENT_ORDER_STATUSES.has("paid")).toBe(false);
    expect(TERMINAL_PAYMENT_ORDER_STATUSES.has("pending")).toBe(false);
  });
});
