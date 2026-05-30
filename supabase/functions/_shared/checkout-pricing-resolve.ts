import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import {
  type DiscountCouponRow,
  type ResolveCheckoutPricingResult,
  resolveCheckoutPricing,
} from "./checkout-pricing.ts";
import { type PackageSku, PACKAGES } from "./payos.ts";

export async function resolveCheckoutPricingForUser(
  admin: SupabaseClient,
  input: {
    userId: string;
    packageSku: PackageSku;
    couponCode: string | null;
    referralCode: string | null;
  },
): Promise<ResolveCheckoutPricingResult> {
  const pkg = PACKAGES[input.packageSku];
  const listAmountVnd = pkg.amountVnd;

  const { data: profile, error: profErr } = await admin
    .from("profiles")
    .select("referral_code")
    .eq("id", input.userId)
    .maybeSingle();

  if (profErr) {
    console.error("checkout pricing profile", profErr);
    return {
      ok: false,
      code: "DB_ERROR",
      message: "Không đọc được hồ sơ.",
    };
  }

  const buyerReferralCode =
    typeof profile?.referral_code === "string" ? profile.referral_code : null;

  const couponNorm = input.couponCode?.trim().toUpperCase() ?? null;
  let coupon: DiscountCouponRow | null = null;
  let couponAlreadyUsed = false;

  if (couponNorm) {
    const { data: row, error: cErr } = await admin
      .from("discount_coupons")
      .select(
        "code, discount_kind, discount_value, active, valid_from, valid_until, max_redemptions, redemption_count, allowed_package_skus",
      )
      .eq("code", couponNorm)
      .maybeSingle();

    if (cErr) {
      console.error("discount_coupons lookup", cErr);
      return {
        ok: false,
        code: "DB_ERROR",
        message: "Không kiểm tra được mã giảm giá.",
      };
    }
    if (row) {
      coupon = row as DiscountCouponRow;
    }

    const { count, error: usedErr } = await admin
      .from("payment_orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", input.userId)
      .eq("coupon_code", couponNorm)
      .eq("status", "paid");

    if (usedErr) {
      console.error("coupon usage check", usedErr);
    } else if ((count ?? 0) > 0) {
      couponAlreadyUsed = true;
    }
  }

  const referralNorm = input.referralCode?.trim().toUpperCase() ?? null;
  let referrerProfileId: string | null = null;

  if (referralNorm) {
    const { data: referrer, error: refErr } = await admin
      .from("profiles")
      .select("id")
      .eq("referral_code", referralNorm)
      .maybeSingle();

    if (refErr) {
      console.error("referrer lookup", refErr);
      return {
        ok: false,
        code: "DB_ERROR",
        message: "Không kiểm tra được mã giới thiệu.",
      };
    }
    referrerProfileId = referrer?.id ?? null;
  }

  const { data: cfgRow } = await admin
    .from("app_config")
    .select("value")
    .eq("config_key", "checkout_referral_discount_percent")
    .maybeSingle();

  let referralDiscountPercent = 0;
  if (cfgRow && typeof cfgRow.value === "string") {
    const n = Number.parseInt(cfgRow.value.trim(), 10);
    if (Number.isFinite(n) && n >= 0) referralDiscountPercent = n;
  }

  return resolveCheckoutPricing({
    packageSku: input.packageSku,
    listAmountVnd,
    couponCode: couponNorm,
    referralCode: referralNorm,
    buyerUserId: input.userId,
    buyerReferralCode,
    coupon,
    referrerProfileId,
    referralDiscountPercent,
    couponAlreadyUsedByBuyer: couponAlreadyUsed,
  });
}
