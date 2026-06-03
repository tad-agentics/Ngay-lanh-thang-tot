import { describe, expect, it } from "vitest";

import {
  payTrackablePriceAriaLabel,
  priceVndFromLabel,
  resolveTrackableValueVnd,
} from "~/lib/pay-confirm-ui";

describe("priceVndFromLabel", () => {
  it("parses dotted VND labels", () => {
    expect(priceVndFromLabel("499.000₫")).toBe(499_000);
    expect(priceVndFromLabel("1.097.000")).toBe(1_097_000);
  });

  it("returns 0 for empty input", () => {
    expect(priceVndFromLabel("")).toBe(0);
    expect(priceVndFromLabel("₫")).toBe(0);
  });
});

describe("resolveTrackableValueVnd", () => {
  it("prefers positive quoted amount", () => {
    expect(resolveTrackableValueVnd(269_100, "499.000₫")).toBe(269_100);
  });

  it("falls back to label when amount is missing or non-positive", () => {
    expect(resolveTrackableValueVnd(null, "499.000₫")).toBe(499_000);
    expect(resolveTrackableValueVnd(0, "499.000₫")).toBe(499_000);
    expect(resolveTrackableValueVnd(undefined, "799.000₫")).toBe(799_000);
  });
});

describe("payTrackablePriceAriaLabel", () => {
  it("describes sale-only price", () => {
    expect(payTrackablePriceAriaLabel({ price: "299.000", per: "3 tháng" })).toBe(
      "Giá 299.000 đ, 3 tháng",
    );
  });

  it("includes compare-at when present", () => {
    expect(
      payTrackablePriceAriaLabel({
        price: "499.000",
        baseline: "797.000",
        per: "6 tháng",
      }),
    ).toBe("Giá 499.000 đ, giảm từ 797.000 đ, 6 tháng");
  });
});
