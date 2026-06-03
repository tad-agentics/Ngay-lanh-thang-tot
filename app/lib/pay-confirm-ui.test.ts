import { describe, expect, it } from "vitest";

import {
  formatLabelWithCurrency,
  payTrackablePriceAriaLabel,
  priceDisplay,
  priceVndFromLabel,
  resolveTrackableValueVnd,
} from "~/lib/pay-confirm-ui";

function normVnd(s: string): string {
  return s.replace(/\u00a0/g, " ");
}

describe("formatLabelWithCurrency", () => {
  it("normalizes catalog labels to Intl ₫", () => {
    expect(normVnd(formatLabelWithCurrency("299.000₫"))).toBe("299.000 ₫");
    expect(normVnd(formatLabelWithCurrency("299.000"))).toBe("299.000 ₫");
    expect(normVnd(formatLabelWithCurrency("299.000đ"))).toBe("299.000 ₫");
    expect(normVnd(formatLabelWithCurrency("299.000 đ"))).toBe("299.000 ₫");
    expect(formatLabelWithCurrency("")).toBe("");
  });
});

describe("priceVndFromLabel", () => {
  it("parses integer VND from formatted labels", () => {
    expect(priceVndFromLabel("499.000₫")).toBe(499_000);
    expect(priceVndFromLabel("499.000 ₫")).toBe(499_000);
    expect(priceVndFromLabel("₫")).toBe(0);
  });
});

describe("resolveTrackableValueVnd", () => {
  it("prefers positive quoted amount", () => {
    expect(resolveTrackableValueVnd(269_100, "499.000₫")).toBe(269_100);
  });

  it("falls back to catalog from label", () => {
    expect(resolveTrackableValueVnd(null, "499.000₫")).toBe(499_000);
    expect(resolveTrackableValueVnd(0, "499.000₫")).toBe(499_000);
    expect(resolveTrackableValueVnd(undefined, "799.000₫")).toBe(799_000);
  });
});

describe("payTrackablePriceAriaLabel", () => {
  it("includes per period", () => {
    expect(
      normVnd(payTrackablePriceAriaLabel({ price: "299.000", per: "3 tháng" })),
    ).toBe("Giá 299.000 ₫, 3 tháng");
  });

  it("includes baseline compare-at", () => {
    const result = payTrackablePriceAriaLabel({
      price: "499.000",
      baseline: "797.000",
      per: "6 tháng",
    });
    expect(normVnd(result)).toBe("Giá 499.000 ₫, giảm từ 797.000 ₫, 6 tháng");
  });
});

describe("priceDisplay", () => {
  it("strips currency symbol from labels", () => {
    expect(priceDisplay("499.000₫")).toBe("499.000");
  });
});
