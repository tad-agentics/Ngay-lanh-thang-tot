import { describe, expect, it } from "vitest";

import {
  PAY_CHECKOUT_TIMEOUT_MS,
  TERMINAL_PAYMENT_ORDER_STATUSES,
} from "./pay-checkout-timeout";

describe("pay-checkout-timeout", () => {
  it("uses 15 minute checkout window (G3)", () => {
    expect(PAY_CHECKOUT_TIMEOUT_MS).toBe(15 * 60 * 1000);
  });

  it("treats expired/failed/cancelled as terminal poll states", () => {
    expect(TERMINAL_PAYMENT_ORDER_STATUSES.has("expired")).toBe(true);
    expect(TERMINAL_PAYMENT_ORDER_STATUSES.has("paid")).toBe(false);
    expect(TERMINAL_PAYMENT_ORDER_STATUSES.has("pending")).toBe(false);
  });
});
