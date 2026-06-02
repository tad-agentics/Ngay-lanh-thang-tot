import type { PackageSku } from "~/lib/api-types";
import {
  LUAN_LA_SO_BAT_TU_TITLE_SHORT,
} from "~/lib/luan-la-so-bat-tu-labels";
import {
  LUAN_LUU_NIEN_NGUYET_TITLE,
  LUAN_LUU_NIEN_NGUYET_TITLE_SHORT,
} from "~/lib/luan-luu-nien-nguyet-labels";

export const SUBSCRIPTION_SKUS: PackageSku[] = [
  "goi_1thang",
  "goi_6thang",
  "goi_12thang",
];

export const ADDON_SKUS: PackageSku[] = ["luan_bat_tu", "luan_tieu_van"];

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
    priceLabel: "299.000₫",
    featured: false,
    kind: "subscription",
  },
  {
    sku: "goi_6thang",
    title: "6 tháng",
    subtitle: `Lịch cá nhân + ${LUAN_LUU_NIEN_NGUYET_TITLE} trong gói.`,
    priceLabel: "499.000₫",
    featured: false,
    kind: "subscription",
  },
  {
    sku: "goi_12thang",
    title: "1 năm",
    subtitle: `Toàn bộ tính năng — lịch + luận Bát tự + ${LUAN_LUU_NIEN_NGUYET_TITLE_SHORT}.`,
    priceLabel: "799.000₫",
    badge: "Đề xuất",
    featured: true,
    kind: "subscription",
  },
  {
    sku: "luan_bat_tu",
    title: LUAN_LA_SO_BAT_TU_TITLE_SHORT,
    subtitle: "Mở khóa luận giải lá số Bát tự đầy đủ — dùng vĩnh viễn.",
    priceLabel: "299.000₫",
    featured: false,
    kind: "addon",
  },
  {
    sku: "luan_tieu_van",
    title: LUAN_LUU_NIEN_NGUYET_TITLE_SHORT,
    subtitle: `${LUAN_LUU_NIEN_NGUYET_TITLE} — 12 tháng tới.`,
    priceLabel: "199.000₫",
    featured: false,
    kind: "addon",
  },
];
