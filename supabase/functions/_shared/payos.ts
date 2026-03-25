/** PayOS v2 helpers — create link + webhook verify (per payos.vn docs). */

export type PackageSku = "le" | "goi_6thang" | "goi_12thang";

export type PackageDef = {
  sku: PackageSku;
  /** VND (integer) */
  amountVnd: number;
  creditsToAdd: number | null;
  subscriptionMonths: number | null;
  /** ≤9 chars recommended for some bank channels */
  description: string;
};

export const PACKAGES: Record<PackageSku, PackageDef> = {
  le: {
    sku: "le",
    amountVnd: 99_000,
    creditsToAdd: 100,
    subscriptionMonths: null,
    description: "100 luong",
  },
  goi_6thang: {
    sku: "goi_6thang",
    amountVnd: 789_000,
    creditsToAdd: null,
    subscriptionMonths: 6,
    description: "Goi 6 T",
  },
  goi_12thang: {
    sku: "goi_12thang",
    amountVnd: 989_000,
    creditsToAdd: null,
    subscriptionMonths: 12,
    description: "Goi 12 T",
  },
};

export function isPackageSku(x: string): x is PackageSku {
  return x === "le" || x === "goi_6thang" || x === "goi_12thang";
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

/** Webhook `data` object verification (payment link) */
export async function verifyWebhookSignature(
  data: Record<string, unknown>,
  signature: string,
  checksumKey: string,
): Promise<boolean> {
  const sorted = sortKeys(data);
  const parts: string[] = [];
  for (const key of Object.keys(sorted)) {
    let value: unknown = sorted[key];
    if (value !== undefined && Array.isArray(value)) {
      value = JSON.stringify(
        (value as unknown[]).map((val) =>
          typeof val === "object" && val !== null && !Array.isArray(val)
            ? sortKeys(val as Record<string, unknown>)
            : val,
        ),
      );
    }
    if ([null, undefined, "undefined", "null"].includes(value as null)) {
      value = "";
    }
    parts.push(`${key}=${value}`);
  }
  const dataQueryStr = parts.join("&");
  const computed = await hmacSha256Hex(checksumKey, dataQueryStr);
  return computed.toLowerCase() === signature.toLowerCase();
}

export function generateOrderCode(): number {
  const rnd = Math.floor(Math.random() * 900_000) + 100_000;
  return Math.floor(Date.now() / 1000) * 1_000_000 + rnd;
}

export const PAYOS_API_BASE = "https://api-merchant.payos.vn";
