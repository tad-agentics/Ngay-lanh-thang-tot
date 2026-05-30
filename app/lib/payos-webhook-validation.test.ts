import { describe, expect, it } from "vitest";

import {
  PACKAGES,
  parseWebhookAmountVnd,
  validateWebhookSkuAmount,
} from "../../supabase/functions/_shared/payos.ts";

describe("parseWebhookAmountVnd", () => {
  it("accepts positive integers", () => {
    expect(parseWebhookAmountVnd(299_000)).toBe(299_000);
    expect(parseWebhookAmountVnd("499000")).toBe(499_000);
  });

  it("rejects invalid amounts", () => {
    expect(parseWebhookAmountVnd(0)).toBeNull();
    expect(parseWebhookAmountVnd(99.5)).toBeNull();
    expect(parseWebhookAmountVnd("abc")).toBeNull();
  });
});

describe("validateWebhookSkuAmount", () => {
  it("passes when webhook, order, and PACKAGES align", () => {
    const pkg = PACKAGES.goi_1thang;
    const result = validateWebhookSkuAmount(
      {
        package_sku: pkg.sku,
        amount_vnd: pkg.amountVnd,
        credits_to_add: pkg.creditsToAdd,
        subscription_months: pkg.subscriptionMonths,
      },
      pkg.amountVnd,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sku).toBe("goi_1thang");
      expect(result.canonicalAmountVnd).toBe(299_000);
    }
  });

  it("rejects webhook amount mismatch with order", () => {
    const pkg = PACKAGES.goi_6thang;
    const result = validateWebhookSkuAmount(
      {
        package_sku: pkg.sku,
        amount_vnd: pkg.amountVnd,
        credits_to_add: pkg.creditsToAdd,
        subscription_months: pkg.subscriptionMonths,
      },
      1,
    );
    expect(result).toEqual({ ok: false, reason: "order_amount_mismatch" });
  });

  it("accepts discounted paid amount matching webhook", () => {
    const pkg = PACKAGES.goi_1thang;
    const discounted = 242_190;
    const result = validateWebhookSkuAmount(
      {
        package_sku: pkg.sku,
        amount_vnd: discounted,
        credits_to_add: pkg.creditsToAdd,
        subscription_months: pkg.subscriptionMonths,
      },
      discounted,
    );
    expect(result.ok).toBe(true);
  });

  it("rejects tampered order credits_to_add", () => {
    const pkg = PACKAGES.le;
    const result = validateWebhookSkuAmount(
      {
        package_sku: pkg.sku,
        amount_vnd: pkg.amountVnd,
        credits_to_add: 999,
        subscription_months: pkg.subscriptionMonths,
      },
      pkg.amountVnd,
    );
    expect(result).toEqual({ ok: false, reason: "order_credits_mismatch" });
  });

  it("rejects unknown package_sku", () => {
    const result = validateWebhookSkuAmount(
      {
        package_sku: "fake_sku",
        amount_vnd: 299_000,
        credits_to_add: null,
        subscription_months: 3,
      },
      299_000,
    );
    expect(result).toEqual({ ok: false, reason: "invalid_package_sku" });
  });
});
