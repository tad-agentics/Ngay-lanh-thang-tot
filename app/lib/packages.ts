import type { PackageSku } from "~/lib/api-types";

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
    subtitle: "Lịch cá nhân + luận giải Tiểu vận trong gói.",
    priceLabel: "499.000₫",
    featured: false,
    kind: "subscription",
  },
  {
    sku: "goi_12thang",
    title: "1 năm",
    subtitle: "Toàn bộ tính năng — lịch + luận Bát tự + Tiểu vận.",
    priceLabel: "799.000₫",
    badge: "Đề xuất",
    featured: true,
    kind: "subscription",
  },
  {
    sku: "luan_bat_tu",
    title: "Luận Bát tự",
    subtitle: "Mở khóa luận giải Bát tự đầy đủ — dùng vĩnh viễn.",
    priceLabel: "299.000₫",
    featured: false,
    kind: "addon",
  },
  {
    sku: "luan_tieu_van",
    title: "Luận Tiểu vận",
    subtitle: "Luận giải Tiểu vận 12 tháng tới.",
    priceLabel: "199.000₫",
    featured: false,
    kind: "addon",
  },
];
