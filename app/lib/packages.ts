import type { PackageSku } from "~/lib/api-types";

export const UI_PACKAGES: {
  sku: PackageSku;
  title: string;
  subtitle: string;
  priceLabel: string;
  creditsLabel: string;
  mathNote: string;
  featured: boolean;
}[] = [
  {
    sku: "le",
    title: "Lẻ — gói nhỏ",
    subtitle:
      "Mua một lần, dùng dần — không tự động nạp. Còn dư sau 12 tháng thì hết hiệu lực.",
    priceLabel: "99.000₫",
    creditsLabel: "100 lượng",
    mathNote: "≈ 10 lần chọn ngày · hoặc 12 lần hợp tuổi",
    featured: false,
  },
  {
    sku: "goi_6thang",
    title: "Tháng An Cư",
    subtitle:
      "6 tháng không trừ lượng từng việc — thoải mái thử nhiều ngày, nhiều tháng. Hợp giai đoạn bận: cưới hỏi, khai trương, nhà mới.",
    priceLabel: "789.000₫",
    creditsLabel: "Dùng thoải mái",
    mathNote: "≈ 131.500₫ / tháng · tiết kiệm so với gói lẻ",
    featured: true,
  },
  {
    sku: "goi_12thang",
    title: "Năm Phú Quý",
    subtitle:
      "Cả năm tra cứu không tính lượt — chọn ngày, vận tháng, hợp tuổi, phong thủy. Giá mỗi tháng thấp hơn ~37% so với gói 6 tháng.",
    priceLabel: "989.000₫",
    creditsLabel: "Dùng thoải mái",
    mathNote: "≈ 82.400₫ / tháng · tiết kiệm nhất",
    featured: false,
  },
];
