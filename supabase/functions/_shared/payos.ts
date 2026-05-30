/** PayOS v2 helpers — create link + webhook verify (per payos.vn docs). */

import {
  applyYearlyBundleLuận,
  extendSubscriptionMonths,
} from "./entitlements.ts";

export type PackageSku =
  | "le"
  | "goi_1thang"
  | "goi_6thang"
  | "goi_12thang"
  | "luan_bat_tu"
  | "luan_tieu_van";

export type PackageDef = {
  sku: PackageSku;
  /** VND (integer) */
  amountVnd: number;
  creditsToAdd: number | null;
  subscriptionMonths: number | null;
  /** Standalone Bát tự luận unlock */
  baziUnlock: boolean;
  /** Years to add to tieu_van_reading_expires_at */
  tieuVanYears: number | null;
  /** Legacy SKU — webhook only, not offered in Direction C checkout */
  legacyCheckout?: boolean;
  description: string;
};

export const PACKAGES: Record<PackageSku, PackageDef> = {
  le: {
    sku: "le",
    amountVnd: 99_000,
    creditsToAdd: 100,
    subscriptionMonths: null,
    baziUnlock: false,
    tieuVanYears: null,
    legacyCheckout: true,
    description: "100 luong",
  },
  goi_1thang: {
    sku: "goi_1thang",
    amountVnd: 299_000,
    creditsToAdd: null,
    subscriptionMonths: 3,
    baziUnlock: false,
    tieuVanYears: null,
    description: "Goi 3T dung thu",
  },
  goi_6thang: {
    sku: "goi_6thang",
    amountVnd: 499_000,
    creditsToAdd: null,
    subscriptionMonths: 6,
    baziUnlock: false,
    tieuVanYears: 1,
    description: "Goi 6T + TV",
  },
  goi_12thang: {
    sku: "goi_12thang",
    amountVnd: 799_000,
    creditsToAdd: null,
    subscriptionMonths: 12,
    baziUnlock: true,
    tieuVanYears: 1,
    description: "Goi 12T",
  },
  luan_bat_tu: {
    sku: "luan_bat_tu",
    amountVnd: 299_000,
    creditsToAdd: null,
    subscriptionMonths: null,
    baziUnlock: true,
    tieuVanYears: null,
    description: "Luan BT",
  },
  luan_tieu_van: {
    sku: "luan_tieu_van",
    amountVnd: 199_000,
    creditsToAdd: null,
    subscriptionMonths: null,
    baziUnlock: false,
    tieuVanYears: 1,
    description: "Luan TV",
  },
};

export const CHECKOUT_PACKAGE_SKUS: PackageSku[] = (
  Object.keys(PACKAGES) as PackageSku[]
).filter((sku) => !PACKAGES[sku].legacyCheckout);

export function isPackageSku(x: string): x is PackageSku {
  return x in PACKAGES;
}

/** Row fields used to cross-check PayOS webhook amount before fulfillment. */
export type PaymentOrderFulfillmentRow = {
  package_sku: string | null;
  amount_vnd: number | null;
  credits_to_add: number | null;
  subscription_months: number | null;
};

export type WebhookSkuAmountValidation =
  | { ok: true; sku: PackageSku; canonicalAmountVnd: number; pkg: PackageDef }
  | { ok: false; reason: string };

/** Parse PayOS webhook `data.amount` — must be a positive integer VND. */
export function parseWebhookAmountVnd(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Number.isInteger(raw) && raw > 0 ? raw : null;
  }
  if (typeof raw === "string") {
    const t = raw.trim();
    if (/^\d+$/.test(t)) {
      const n = Number.parseInt(t, 10);
      return n > 0 ? n : null;
    }
  }
  return null;
}

function nullableIntMatch(
  orderVal: number | null | undefined,
  pkgVal: number | null,
): boolean {
  const o = orderVal ?? null;
  const p = pkgVal ?? null;
  if (o === null && p === null) return true;
  if (o === null || p === null) return false;
  return o === p;
}

const MIN_PAID_AMOUNT_VND = 1_000;

/**
 * SKU ↔ amount gate: webhook must match order.amount_vnd (final charge, may be
 * discounted). Catalog cap = PACKAGES[sku].amountVnd; fulfillment columns match SKU.
 */
export function validateWebhookSkuAmount(
  order: PaymentOrderFulfillmentRow,
  webhookAmountVnd: number | null,
): WebhookSkuAmountValidation {
  if (webhookAmountVnd === null) {
    return { ok: false, reason: "invalid_webhook_amount" };
  }

  const skuRaw = order.package_sku?.trim() ?? "";
  if (!skuRaw || !isPackageSku(skuRaw)) {
    return { ok: false, reason: "invalid_package_sku" };
  }

  const pkg = PACKAGES[skuRaw];
  const canonical = pkg.amountVnd;

  if (order.amount_vnd == null || order.amount_vnd !== webhookAmountVnd) {
    return { ok: false, reason: "order_amount_mismatch" };
  }

  if (order.amount_vnd > canonical) {
    return { ok: false, reason: "order_amount_above_catalog" };
  }

  if (order.amount_vnd < MIN_PAID_AMOUNT_VND) {
    return { ok: false, reason: "order_amount_too_low" };
  }

  if (!nullableIntMatch(order.credits_to_add, pkg.creditsToAdd)) {
    return { ok: false, reason: "order_credits_mismatch" };
  }

  if (!nullableIntMatch(order.subscription_months, pkg.subscriptionMonths)) {
    return { ok: false, reason: "order_subscription_months_mismatch" };
  }

  return { ok: true, sku: skuRaw, canonicalAmountVnd: canonical, pkg };
}

export function applyPackageEntitlements(
  profile: {
    subscription_expires_at: string | null;
    bazi_reading_unlocked_at: string | null;
    tieu_van_reading_expires_at: string | null;
  },
  sku: PackageSku,
): Record<string, string> {
  const pkg = PACKAGES[sku];
  const patch: Record<string, string> = {};

  if (pkg.subscriptionMonths != null && pkg.subscriptionMonths > 0) {
    patch.subscription_expires_at = extendSubscriptionMonths(
      profile.subscription_expires_at,
      pkg.subscriptionMonths,
    );
  }

  if (pkg.baziUnlock || sku === "goi_12thang") {
    const extras = sku === "goi_12thang"
      ? applyYearlyBundleLuận(profile)
      : { bazi_reading_unlocked_at: profile.bazi_reading_unlocked_at ?? new Date().toISOString() };
    if (extras.bazi_reading_unlocked_at) {
      patch.bazi_reading_unlocked_at = extras.bazi_reading_unlocked_at;
    }
    if ("tieu_van_reading_expires_at" in extras && extras.tieu_van_reading_expires_at) {
      patch.tieu_van_reading_expires_at = extras.tieu_van_reading_expires_at;
    }
  }

  if (pkg.tieuVanYears != null && pkg.tieuVanYears > 0 && sku !== "goi_12thang") {
    const base = profile.tieu_van_reading_expires_at
      ? new Date(profile.tieu_van_reading_expires_at)
      : new Date();
    const from = base > new Date() ? base : new Date();
    const next = new Date(from);
    next.setFullYear(next.getFullYear() + pkg.tieuVanYears);
    patch.tieu_van_reading_expires_at = next.toISOString();
  }

  return patch;
}

/** Signature for POST /v2/payment-requests body */
export async function signPaymentRequest(params: {
  amount: number;
  cancelUrl: string;
  description: string;
  orderCode: number;
  returnUrl: string;
  checksumKey: string;
}): Promise<string> {
  const { amount, cancelUrl, description, orderCode, returnUrl, checksumKey } =
    params;
  const raw =
    `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
  return hmacSha256Hex(checksumKey, raw);
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function sortKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = obj[key];
  }
  return sorted;
}

export async function verifyWebhookSignature(
  data: Record<string, unknown>,
  signature: string,
  checksumKey: string,
): Promise<boolean> {
  const sorted = sortKeys(data);
  const pairs = Object.entries(sorted).map(([k, v]) => `${k}=${v}`);
  const raw = pairs.join("&");
  const expected = await hmacSha256Hex(checksumKey, raw);
  return expected === signature;
}

export function generateOrderCode(): number {
  return Math.floor(100000000 + Math.random() * 900000000);
}

export const PAYOS_API_BASE = "https://api-merchant.payos.vn";
