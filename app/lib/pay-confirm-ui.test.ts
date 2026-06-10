import { describe, expect, it } from "vitest";

import {
  formatLabelWithCurrency,
  payTrackablePriceAriaLabel,
  PAY_CONFIRM_TIER_META,
  priceDisplay,
  priceVndFromLabel,
  resolveTrackableValueVnd,
} from "~/lib/pay-confirm-ui";
import { PACKAGE_AMOUNT_VND } from "~/lib/package-amount-vnd";
import { formatVndDigits } from "~/lib/vnd-format";

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
    expect(resolveTrackableValueVnd(undefined, "549.000₫")).toBe(549_000);
  });
});

describe("payTrackablePriceAriaLabel", () => {
  it("includes per period", () => {
    expect(
      normVnd(payTrackablePriceAriaLabel({ price: "299.000", per: "3 tháng" })),
    ).toBe("Giá 299.000 ₫, 3 tháng");
  });

  it("includes baseline compare-at", () => {
    const meta = PAY_CONFIRM_TIER_META.goi_6thang;
    const result = payTrackablePriceAriaLabel({
      price: formatVndDigits(PACKAGE_AMOUNT_VND.goi_6thang),
      baseline: meta?.baseline ?? null,
      per: "6 tháng",
    });
    expect(normVnd(result)).toBe(
      `Giá ${formatVndDigits(PACKAGE_AMOUNT_VND.goi_6thang)} ₫, giảm từ ${meta?.baseline} ₫, 6 tháng`,
    );
  });
});

describe("priceDisplay", () => {
  it("strips currency symbol from labels", () => {
    expect(priceDisplay("499.000₫")).toBe("499.000");
  });
});
