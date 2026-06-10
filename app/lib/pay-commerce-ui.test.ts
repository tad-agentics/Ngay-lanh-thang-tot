import { describe, expect, it } from "vitest";

import { TIEU_VAN_LUAN_ENABLED } from "~/lib/feature-flags";

import {
  brandedSubscriptionPlanName,
  formatPaymentOrderRef,
  formatVndDigits,
  formatVndPriceDisplay,
  withVndCurrency,
  subscriptionDurationLabel,
  yearCanChiFromLaSo,
  subscriptionUpsellDeltaVnd,
  yearlyPlanUpsellDeltaVnd,
} from "~/lib/pay-commerce-ui";

/** Intl vi-VN may use NBSP before ₫. */
function normVnd(s: string): string {
  return s.replace(/\u00a0/g, " ");
}

describe("pay-commerce-ui", () => {
  it("formats order ref with NLTT prefix", () => {
    expect(formatPaymentOrderRef("a1b2c3d4-e5f6-7890-abcd-ef1234567890")).toMatch(
      /^NLTT-\d{4}-\d{4}-[A-F0-9]{4}$/,
    );
  });

  it("reads year can chi from la_so year pillar", () => {
    expect(
      yearCanChiFromLaSo({
        year: { can: { name: "Đinh" }, chi: { name: "Mùi" } },
      }),
    ).toBe("Đinh Mùi");
  });

  it("brands yearly plan with can chi when available", () => {
    const name = brandedSubscriptionPlanName("goi_12thang", {
      year: { can: { name: "Đinh" }, chi: { name: "Mùi" } },
    });
    expect(name).toMatch(/^Lịch Đinh Mùi \d{4}$/);
  });

  it("maps subscription duration labels", () => {
    expect(subscriptionDurationLabel("goi_12thang")).toBe("1 năm");
    expect(subscriptionDurationLabel("goi_6thang")).toBe("6 tháng");
    expect(subscriptionDurationLabel("goi_1thang")).toBe("3 tháng");
  });

  it("computes yearly upsell delta from addon price", () => {
    expect(yearlyPlanUpsellDeltaVnd("luan_bat_tu")).toBe(250_000);
  });

  it.skipIf(!TIEU_VAN_LUAN_ENABLED)("computes 6-month upsell delta for Tiểu vận addon", () => {
    expect(subscriptionUpsellDeltaVnd("luan_tieu_van", "goi_6thang")).toBe(300_000);
  });

  it("formats VND via Intl currency (₫ symbol)", () => {
    expect(formatVndDigits(299_000)).toBe("299.000");
    expect(normVnd(formatVndPriceDisplay(299_000))).toBe("299.000 ₫");
    expect(normVnd(formatVndPriceDisplay(1_097_000))).toBe("1.097.000 ₫");
    expect(normVnd(formatVndPriceDisplay(7_990))).toBe("7.990 ₫");
    expect(normVnd(withVndCurrency("299.000"))).toBe("299.000 ₫");
    expect(withVndCurrency("")).toBe("");
  });
});
