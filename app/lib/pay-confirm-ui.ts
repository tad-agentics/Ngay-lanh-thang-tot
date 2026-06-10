import type { PackageSku } from "~/lib/api-types";
import { LUAN_LA_SO_BAT_TU_TITLE } from "~/lib/luan-la-so-bat-tu-labels";
import {
  LUAN_LUU_NIEN_NGUYET_TITLE,
  LUAN_LUU_NIEN_NGUYET_TITLE_SHORT,
} from "~/lib/luan-luu-nien-nguyet-labels";
import { formatVndPriceDisplay } from "~/lib/vnd-format";
import { TIEU_VAN_LUAN_ENABLED } from "~/lib/feature-flags";
import { UI_PACKAGES } from "~/lib/packages";
import {
  formatTierBaselineDigits,
  formatTierSaveLabel,
  subscriptionSixMonthBaselineVnd,
  subscriptionStarterPerDaySubtitle,
  subscriptionTierSavingsVnd,
  subscriptionYearBaselineVnd,
} from "~/lib/subscription-tier-pricing";

const sixMonthSave = subscriptionTierSavingsVnd("goi_6thang");
const yearSave = subscriptionTierSavingsVnd("goi_12thang");

export const PAY_CONFIRM_TIER_META: Partial<
  Record<
    PackageSku,
    { baseline: string | null; per: string; save: string | null; sub: string }
  >
> = {
  goi_1thang: {
    baseline: null,
    per: "3 tháng",
    save: null,
    sub: subscriptionStarterPerDaySubtitle(),
  },
  goi_6thang: {
    baseline:
      sixMonthSave != null && sixMonthSave > 0
        ? formatTierBaselineDigits(subscriptionSixMonthBaselineVnd())
        : null,
    per: "6 tháng",
    save:
      sixMonthSave != null && sixMonthSave > 0
        ? formatTierSaveLabel(sixMonthSave)
        : null,
    sub: TIEU_VAN_LUAN_ENABLED
      ? `Lịch + ${LUAN_LUU_NIEN_NGUYET_TITLE_SHORT}`
      : "Lịch cá nhân 6 tháng",
  },
  goi_12thang: {
    baseline:
      yearSave != null && yearSave > 0
        ? formatTierBaselineDigits(subscriptionYearBaselineVnd())
        : null,
    per: "cả năm",
    save:
      yearSave != null && yearSave > 0 ? formatTierSaveLabel(yearSave) : null,
    sub: "Toàn bộ tính năng",
  },
};

export const PAY_CONFIRM_ADDON_META: Partial<
  Record<PackageSku, { title: string; per: string; sub: string }>
> = {
  luan_bat_tu: {
    title: LUAN_LA_SO_BAT_TU_TITLE,
    per: "một lần",
    sub: "5 chương · mệnh · tính cách · quý nhân",
  },
  luan_tieu_van: {
    title: LUAN_LUU_NIEN_NGUYET_TITLE,
    per: "1 năm",
    sub: "lưu niên năm · lưu nguyệt tháng",
  },
};

const SUBSCRIPTION_MONTHS: Partial<Record<PackageSku, number>> = {
  goi_1thang: 3,
  goi_6thang: 6,
  goi_12thang: 12,
};

/** Preview expiry after purchase — `Dùng đến 27.05.2027`. */
export function previewSubscriptionExpiry(sku: PackageSku): string | null {
  const months = SUBSCRIPTION_MONTHS[sku];
  if (!months) return null;
  const end = new Date();
  end.setMonth(end.getMonth() + months);
  const formatted = end.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `Dùng đến ${formatted}`;
}

export function priceDisplay(label: string): string {
  return label.replace(/₫/g, "").trim();
}

/** Catalog label or digit string → `299.000 ₫` (Intl currency). */
export function formatLabelWithCurrency(labelOrDigits: string): string {
  const digits = labelOrDigits.replace(/\D/g, "");
  if (!digits) return "";
  const amount = Number.parseInt(digits, 10);
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return formatVndPriceDisplay(amount);
}

/** Integer VND from labels like `499.000₫` — for `data-track-price-vnd` hints. */
export function priceVndFromLabel(label: string): number {
  const digits = label.replace(/\D/g, "");
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
}

/** Sale amount for tracking attrs — ignores zero/invalid quote amounts. */
export function resolveTrackableValueVnd(
  amountVnd: number | null | undefined,
  priceLabel: string,
): number {
  if (typeof amountVnd === "number" && Number.isFinite(amountVnd) && amountVnd > 0) {
    return Math.round(amountVnd);
  }
  return priceVndFromLabel(priceLabel);
}

/** Screen reader summary for price column (sale + optional compare-at). */
export function payTrackablePriceAriaLabel(args: {
  price: string;
  baseline?: string | null;
  per?: string;
}): string {
  const sale = formatLabelWithCurrency(args.price);
  if (args.baseline) {
    const base = `Giá ${sale}, giảm từ ${formatLabelWithCurrency(args.baseline)}`;
    return args.per ? `${base}, ${args.per}` : base;
  }
  const base = `Giá ${sale}`;
  return args.per ? `${base}, ${args.per}` : base;
}

/** Addon checkout upsell — 6 tháng = lịch + Tiểu vận; 1 năm = toàn bộ tính năng. */
export function addonSubscriptionUpsell(addonSku: PackageSku): {
  planSku: PackageSku;
  planLabel: string;
  priceLabel: string;
  benefit: string;
} | null {
  const sixMonth = UI_PACKAGES.find((p) => p.sku === "goi_6thang");
  const yearly = UI_PACKAGES.find((p) => p.sku === "goi_12thang");

  if (addonSku === "luan_tieu_van" && TIEU_VAN_LUAN_ENABLED && sixMonth) {
    return {
      planSku: "goi_6thang",
      planLabel: "Lịch 6 tháng",
      priceLabel: sixMonth.priceLabel,
      benefit: `thêm lịch cá nhân + ${LUAN_LUU_NIEN_NGUYET_TITLE} trong gói`,
    };
  }
  if (addonSku === "luan_bat_tu" && yearly) {
    return {
      planSku: "goi_12thang",
      planLabel: "Lịch năm",
      priceLabel: yearly.priceLabel,
      benefit: TIEU_VAN_LUAN_ENABLED
        ? `mở toàn bộ tính năng — lịch + luận Bát tự + ${LUAN_LUU_NIEN_NGUYET_TITLE_SHORT}`
        : "mở toàn bộ tính năng — lịch + luận Bát tự",
    };
  }
  return null;
}
