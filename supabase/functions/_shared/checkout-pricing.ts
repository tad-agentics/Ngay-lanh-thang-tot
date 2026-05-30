/** Server-side checkout price resolution (coupon + referral). */

import type { PackageSku } from "./payos.ts";

export const MIN_CHECKOUT_AMOUNT_VND = 1_000;

export type DiscountCouponRow = {
  code: string;
  discount_kind: "percent" | "fixed_vnd";
  discount_value: number;
  active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  max_redemptions: number | null;
  redemption_count: number;
  allowed_package_skus: string[] | null;
};

export type CheckoutDiscountBreakdown = {
  list_amount_vnd: number;
  coupon_discount_vnd: number;
  referral_discount_vnd: number;
  amount_vnd: number;
  coupon_code: string | null;
  checkout_referral_code: string | null;
};

export type ResolveCheckoutPricingInput = {
  packageSku: PackageSku;
  listAmountVnd: number;
  couponCode: string | null;
  referralCode: string | null;
  buyerUserId: string;
  buyerReferralCode: string | null;
  coupon: DiscountCouponRow | null;
  referrerProfileId: string | null;
  referralDiscountPercent: number;
  couponAlreadyUsedByBuyer: boolean;
};

export type ResolveCheckoutPricingResult =
  | {
    ok: true;
    breakdown: CheckoutDiscountBreakdown;
    referrerProfileId: string | null;
  }
  | { ok: false; code: string; message: string };

function normalizeCode(raw: string | null | undefined): string | null {
  const t = raw?.trim().toUpperCase();
  return t && t.length > 0 ? t : null;
}

function couponDiscountVnd(
  list: number,
  coupon: DiscountCouponRow,
): number {
  if (coupon.discount_kind === "percent") {
    return Math.min(
      list,
      Math.floor((list * coupon.discount_value) / 100),
    );
  }
  return Math.min(list, coupon.discount_value);
}

function isCouponValidNow(coupon: DiscountCouponRow, now: Date): boolean {
  if (!coupon.active) return false;
  if (coupon.valid_from && new Date(coupon.valid_from) > now) return false;
  if (coupon.valid_until && new Date(coupon.valid_until) < now) return false;
  if (
    coupon.max_redemptions != null &&
    coupon.redemption_count >= coupon.max_redemptions
  ) {
    return false;
  }
  return true;
}

export function resolveCheckoutPricing(
  input: ResolveCheckoutPricingInput,
): ResolveCheckoutPricingResult {
  const list = input.listAmountVnd;
  if (!Number.isInteger(list) || list < MIN_CHECKOUT_AMOUNT_VND) {
    return {
      ok: false,
      code: "INVALID_LIST_AMOUNT",
      message: "Giá gói không hợp lệ.",
    };
  }

  const couponCode = normalizeCode(input.couponCode);
  const referralCode = normalizeCode(input.referralCode);
  let couponDiscount = 0;
  let referralDiscount = 0;
  let referrerId: string | null = input.referrerProfileId;

  if (couponCode && !input.coupon) {
    return {
      ok: false,
      code: "INVALID_COUPON",
      message: "Mã giảm giá không hợp lệ hoặc đã hết hạn.",
    };
  }

  if (input.coupon) {
    const now = new Date();
    if (!isCouponValidNow(input.coupon, now)) {
      return {
        ok: false,
        code: "INVALID_COUPON",
        message: "Mã giảm giá không hợp lệ hoặc đã hết hạn.",
      };
    }
    if (input.couponAlreadyUsedByBuyer) {
      return {
        ok: false,
        code: "COUPON_ALREADY_USED",
        message: "Bạn đã dùng mã giảm giá này rồi.",
      };
    }
    const allowed = input.coupon.allowed_package_skus;
    if (
      allowed?.length &&
      !allowed.includes(input.packageSku)
    ) {
      return {
        ok: false,
        code: "COUPON_NOT_APPLICABLE",
        message: "Mã giảm giá không áp dụng cho gói này.",
      };
    }
    couponDiscount = couponDiscountVnd(list, input.coupon);
  }

  const afterCoupon = list - couponDiscount;

  if (referralCode) {
    if (
      input.buyerReferralCode &&
      input.buyerReferralCode.toUpperCase() === referralCode
    ) {
      return {
        ok: false,
        code: "REFERRAL_SELF",
        message: "Không thể dùng mã giới thiệu của chính bạn.",
      };
    }
    if (!referrerId) {
      return {
        ok: false,
        code: "INVALID_REFERRAL",
        message: "Mã giới thiệu không tồn tại.",
      };
    }
    if (referrerId === input.buyerUserId) {
      return {
        ok: false,
        code: "REFERRAL_SELF",
        message: "Không thể dùng mã giới thiệu của chính bạn.",
      };
    }
    const pct = Math.min(
      100,
      Math.max(0, Math.floor(input.referralDiscountPercent)),
    );
    if (pct > 0) {
      referralDiscount = Math.floor((afterCoupon * pct) / 100);
    }
  }

  let amount = afterCoupon - referralDiscount;
  if (amount < MIN_CHECKOUT_AMOUNT_VND) {
    amount = MIN_CHECKOUT_AMOUNT_VND;
  }
  if (amount > list) {
    amount = list;
  }

  return {
    ok: true,
    referrerProfileId: referralCode ? referrerId : null,
    breakdown: {
      list_amount_vnd: list,
      coupon_discount_vnd: couponDiscount,
      referral_discount_vnd: referralDiscount,
      amount_vnd: amount,
      coupon_code: couponCode,
      checkout_referral_code: referralCode,
    },
  };
}
