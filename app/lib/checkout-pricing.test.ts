import { describe, expect, it } from "vitest";

import { resolveCheckoutPricing } from "../../supabase/functions/_shared/checkout-pricing.ts";

const baseCoupon = {
  code: "SAVE10",
  discount_kind: "percent" as const,
  discount_value: 10,
  active: true,
  valid_from: null,
  valid_until: null,
  max_redemptions: null,
  redemption_count: 0,
  allowed_package_skus: null,
};

describe("resolveCheckoutPricing", () => {
  it("applies coupon only when referral discount percent is zero", () => {
    const result = resolveCheckoutPricing({
      packageSku: "goi_1thang",
      listAmountVnd: 299_000,
      couponCode: "SAVE10",
      referralCode: "FRIEND1",
      buyerUserId: "buyer",
      buyerReferralCode: "MYCODE",
      coupon: baseCoupon,
      referrerProfileId: "referrer",
      referralDiscountPercent: 0,
      couponAlreadyUsedByBuyer: false,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.breakdown.coupon_discount_vnd).toBe(29_900);
    expect(result.breakdown.referral_discount_vnd).toBe(0);
    expect(result.breakdown.amount_vnd).toBe(269_100);
    expect(result.breakdown.checkout_referral_code).toBe("FRIEND1");
  });

  it("rejects self referral", () => {
    const result = resolveCheckoutPricing({
      packageSku: "goi_1thang",
      listAmountVnd: 299_000,
      couponCode: null,
      referralCode: "MYCODE",
      buyerUserId: "buyer",
      buyerReferralCode: "MYCODE",
      coupon: null,
      referrerProfileId: "buyer",
      referralDiscountPercent: 10,
      couponAlreadyUsedByBuyer: false,
    });
    expect(result).toEqual({
      ok: false,
      code: "REFERRAL_SELF",
      message: "Không thể dùng mã giới thiệu của chính bạn.",
    });
  });
});
