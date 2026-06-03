import { describe, expect, it } from "vitest";

import {
  parseOrderDiscountBreakdown,
  resolveOrderChargeAmounts,
} from "~/lib/payment-order-charge";

describe("resolveOrderChargeAmounts", () => {
  it("uses discounted amount_vnd for Meta (not catalog fallback)", () => {
    const charge = resolveOrderChargeAmounts({
      packageSku: "goi_12thang",
      amountVnd: 7_990,
      listAmountVnd: 799_000,
    });
    expect(charge?.finalVnd).toBe(7_990);
    expect(charge?.hasDiscount).toBe(true);
  });

  it("reads final amount from discount_breakdown when amount_vnd missing", () => {
    const charge = resolveOrderChargeAmounts({
      packageSku: "goi_1thang",
      amountVnd: null,
      discountBreakdown: {
        list_amount_vnd: 299_000,
        amount_vnd: 269_100,
        coupon_discount_vnd: 29_900,
      },
    });
    expect(charge?.finalVnd).toBe(269_100);
    expect(charge?.listVnd).toBe(299_000);
  });

  it("uses pending session quote before catalog fallback", () => {
    const charge = resolveOrderChargeAmounts({
      packageSku: "goi_12thang",
      amountVnd: null,
      pendingAmountVnd: 7_990,
      pendingListAmountVnd: 799_000,
    });
    expect(charge?.finalVnd).toBe(7_990);
    expect(charge?.hasDiscount).toBe(true);
  });

  it("falls back to catalog only when no charge sources", () => {
    const charge = resolveOrderChargeAmounts({
      packageSku: "luan_bat_tu",
      amountVnd: null,
    });
    expect(charge?.finalVnd).toBe(299_000);
  });
});

describe("parseOrderDiscountBreakdown", () => {
  it("parses checkout JSON", () => {
    const b = parseOrderDiscountBreakdown({
      list_amount_vnd: 799_000,
      amount_vnd: 7_990,
    });
    expect(b?.amount_vnd).toBe(7_990);
  });
});
