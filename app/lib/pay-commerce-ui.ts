import type { PackageSku } from "~/lib/api-types";
import { PAY_CONFIRM_TIER_META } from "~/lib/pay-confirm-ui";
import { UI_PACKAGES } from "~/lib/packages";

export const PAY_DISPLAY = { fontFamily: "var(--display)" } as const;
export const PAY_DISPLAY2 = { fontFamily: "var(--display-2)" } as const;
export const PAY_MONO = { fontFamily: "var(--mono)" } as const;

const YEARLY_SKU: PackageSku = "goi_12thang";

function pickStr(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/** Year pillar label from cached `profiles.la_so` — e.g. "Đinh Mùi". */
export function yearCanChiFromLaSo(laSo: unknown): string | null {
  if (!laSo || typeof laSo !== "object") return null;
  const root = laSo as Record<string, unknown>;
  const direct =
    pickStr(root, ["can_chi_year", "yearCanChi", "can_chi_nam"]) ??
    pickStr(root, ["can_chi", "canChi"]);
  if (direct) return direct;

  const year = root.year ?? root.nam;
  if (year && typeof year === "object") {
    const y = year as Record<string, unknown>;
    const can =
      pickStr(y, ["can", "can_name", "thien_can"]) ??
      (y.can && typeof y.can === "object"
        ? pickStr(y.can as Record<string, unknown>, ["name", "label"])
        : null);
    const chi =
      pickStr(y, ["chi", "chi_name", "dia_chi"]) ??
      (y.chi && typeof y.chi === "object"
        ? pickStr(y.chi as Record<string, unknown>, ["name", "label"])
        : null);
    if (can && chi) return `${can} ${chi}`;
    const name = pickStr(y, ["name", "label", "can_chi"]);
    if (name) return name;
  }

  const lunar = root.lunar;
  if (lunar && typeof lunar === "object") {
    const display = pickStr(lunar as Record<string, unknown>, ["display", "year"]);
    if (display) {
      const match = display.match(/([A-ZÀ-Ỹa-zà-ỹ]+\s+[A-ZÀ-Ỹa-zà-ỹ]+)/);
      if (match?.[1]) return match[1];
    }
  }

  return null;
}

/** Branded plan line — Make «Lịch Đinh Mùi 2027» for yearly tier. */
export function brandedSubscriptionPlanName(
  sku: PackageSku,
  laSo?: unknown,
): string {
  const pkg = UI_PACKAGES.find((p) => p.sku === sku);
  if (sku === YEARLY_SKU) {
    const canChi = yearCanChiFromLaSo(laSo);
    const expiryYear = new Date().getFullYear() + 1;
    if (canChi) return `Lịch ${canChi} ${expiryYear}`;
    return `Lịch năm ${expiryYear}`;
  }
  return pkg?.title ?? "Gói lịch";
}

export function subscriptionDurationLabel(sku: PackageSku): string {
  const meta = PAY_CONFIRM_TIER_META[sku];
  if (meta?.per === "/ tháng") return "1 tháng";
  if (meta?.per === "6 tháng") return "6 tháng";
  if (meta?.per === "cả năm") return "1 năm";
  return UI_PACKAGES.find((p) => p.sku === sku)?.title ?? "—";
}

/** Display ref like Make `NLTT-2026-0817-2A`. */
export function formatPaymentOrderRef(orderId: string): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const suffix = orderId.replace(/-/g, "").slice(-4).toUpperCase();
  return `NLTT-${y}-${m}${d}-${suffix}`;
}

export function formatPayFailureTimestamp(at = new Date()): string {
  const parts = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")}.${get("month")}.${get("year")} · ${get("hour")}:${get("minute")}`;
}

export function yearlyPlanUpsellDeltaVnd(addonSku: PackageSku): number | null {
  const yearly = UI_PACKAGES.find((p) => p.sku === YEARLY_SKU);
  const addon = UI_PACKAGES.find((p) => p.sku === addonSku);
  if (!yearly || !addon) return null;
  const yearlyPrice = parseInt(yearly.priceLabel.replace(/\D/g, ""), 10);
  const addonPrice = parseInt(addon.priceLabel.replace(/\D/g, ""), 10);
  if (!Number.isFinite(yearlyPrice) || !Number.isFinite(addonPrice)) return null;
  return Math.max(0, yearlyPrice - addonPrice);
}

export function formatVndThousands(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;
}
