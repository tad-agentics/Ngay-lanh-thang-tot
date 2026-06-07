import type { PackageSku } from "~/lib/api-types";
import { TIEU_VAN_LUAN_ENABLED } from "~/lib/feature-flags";
import {
  LUAN_LA_SO_BAT_TU_TITLE_SHORT,
} from "~/lib/luan-la-so-bat-tu-labels";
import {
  LUAN_LUU_NIEN_NGUYET_TITLE,
  LUAN_LUU_NIEN_NGUYET_TITLE_SHORT,
} from "~/lib/luan-luu-nien-nguyet-labels";
import { PACKAGE_AMOUNT_VND } from "~/lib/package-amount-vnd";
import { formatVndPriceDisplay } from "~/lib/vnd-format";

/** Intl `299.000 ₫` for catalog list price by SKU. */
export function catalogPriceLabel(sku: PackageSku): string {
  return formatVndPriceDisplay(PACKAGE_AMOUNT_VND[sku]);
}

export const SUBSCRIPTION_SKUS: PackageSku[] = [
  "goi_1thang",
  "goi_6thang",
  "goi_12thang",
];

/** All addon SKUs (including temporarily hidden) — payment flow + order lookup. */
export const ALL_ADDON_SKUS: PackageSku[] = ["luan_bat_tu", "luan_tieu_van"];

/** Addons shown in catalog / new checkout. */
export const ADDON_SKUS: PackageSku[] = TIEU_VAN_LUAN_ENABLED
  ? ALL_ADDON_SKUS
  : ["luan_bat_tu"];

export const UI_PACKAGES: {
  sku: PackageSku;
  title: string;
  subtitle: string;
  priceLabel: string;
  badge?: string;
  featured: boolean;
  kind: "subscription" | "addon";
}[] = [
  {
    sku: "goi_1thang",
    title: "3 tháng",
    subtitle: "Chỉ lịch cá nhân — dùng thử trước khi nâng gói.",
    priceLabel: catalogPriceLabel("goi_1thang"),
    featured: false,
    kind: "subscription",
  },
  {
    sku: "goi_6thang",
    title: "6 tháng",
    subtitle: TIEU_VAN_LUAN_ENABLED
      ? `Lịch cá nhân + ${LUAN_LUU_NIEN_NGUYET_TITLE} trong gói.`
      : "Lịch cá nhân 6 tháng.",
    priceLabel: catalogPriceLabel("goi_6thang"),
    featured: false,
    kind: "subscription",
  },
  {
    sku: "goi_12thang",
    title: "1 năm",
    subtitle: TIEU_VAN_LUAN_ENABLED
      ? `Toàn bộ tính năng — lịch + luận Bát tự + ${LUAN_LUU_NIEN_NGUYET_TITLE_SHORT}.`
      : "Toàn bộ tính năng — lịch + luận Bát tự.",
    priceLabel: catalogPriceLabel("goi_12thang"),
    badge: "Đề xuất",
    featured: true,
    kind: "subscription",
  },
  {
    sku: "luan_bat_tu",
    title: LUAN_LA_SO_BAT_TU_TITLE_SHORT,
    subtitle: "Mở khóa luận giải lá số Bát tự đầy đủ — dùng vĩnh viễn.",
    priceLabel: catalogPriceLabel("luan_bat_tu"),
    featured: false,
    kind: "addon",
  },
  ...(TIEU_VAN_LUAN_ENABLED
    ? [
        {
          sku: "luan_tieu_van" as const,
          title: LUAN_LUU_NIEN_NGUYET_TITLE_SHORT,
          subtitle: `${LUAN_LUU_NIEN_NGUYET_TITLE} — 12 tháng tới.`,
          priceLabel: catalogPriceLabel("luan_tieu_van"),
          featured: false,
          kind: "addon" as const,
        },
      ]
    : []),
];
