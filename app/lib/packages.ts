import type { PackageSku } from "~/lib/api-types";

export const UI_PACKAGES: {
  sku: PackageSku;
  title: string;
  subtitle: string;
  priceLabel: string;
}[] = [
  {
    sku: "le",
    title: "Gói lẻ 100 lượng",
    subtitle: "Mua một lần — không gia hạn tự động.",
    priceLabel: "99.000₫",
  },
  {
    sku: "goi_6thang",
    title: "Gói 6 tháng không giới hạn lượng",
    subtitle: "Ưu đãi cho mùa cưới / khai trương nhiều việc.",
    priceLabel: "789.000₫",
  },
  {
    sku: "goi_12thang",
    title: "Gói 12 tháng không giới hạn lượng",
    subtitle: "Tiết kiệm nhất nếu bạn tra cứu quanh năm.",
    priceLabel: "989.000₫",
  },
];
