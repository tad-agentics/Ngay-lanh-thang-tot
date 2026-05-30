import { afterEach, describe, expect, it } from "vitest";

import {
  clearPendingPayment,
  dismissPendingPaymentBanner,
  isPendingPaymentBannerDismissed,
  stashPendingPayment,
} from "./pending-payment-session";

describe("pending-payment-session dismiss", () => {
  afterEach(() => {
    clearPendingPayment();
  });

  it("remembers dismiss per order until cleared", () => {
    dismissPendingPaymentBanner("order-a");
    expect(isPendingPaymentBannerDismissed("order-a")).toBe(true);
    expect(isPendingPaymentBannerDismissed("order-b")).toBe(false);
  });

  it("clears dismiss when a new checkout is stashed", () => {
    stashPendingPayment({
      orderId: "order-a",
      packageSku: "goi_12thang",
      flow: "subscription",
      checkoutUrl: "https://pay.example/a",
      createdAt: new Date().toISOString(),
    });
    dismissPendingPaymentBanner("order-a");
    stashPendingPayment({
      orderId: "order-b",
      packageSku: "goi_12thang",
      flow: "subscription",
      checkoutUrl: "https://pay.example/b",
      createdAt: new Date().toISOString(),
    });
    expect(isPendingPaymentBannerDismissed("order-a")).toBe(false);
  });
});
