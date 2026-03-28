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
    subtitle:
      "Đủ để bạn tra đi tra lại cho tới khi thấy chắc: chọn ngày lành, xem vận tháng, hợp tuổi hay phong thủy — một gói cho nhiều việc, không tính tiền theo tháng. Mua một lần, không gia hạn tự động.",
    priceLabel: "99.000₫",
  },
  {
    sku: "goi_6thang",
    title: "Gói 6 tháng không giới hạn lượng",
    subtitle:
      "Sáu tháng không giới hạn lượng — thoải mái thử nhiều ngày, nhiều tháng và đủ tính năng cho tới khi thấy ổn. Hợp giai đoạn bận: cưới hỏi, khai trương, nhà mới. Mua một lần cho trọn nửa năm, không gia hạn tự động.",
    priceLabel: "789.000₫",
  },
  {
    sku: "goi_12thang",
    title: "Gói 12 tháng không giới hạn lượng",
    subtitle:
      "Cả năm tra cứu không tính lượt — mỗi lần cần là có ngay chọn ngày, vận tháng, hợp tuổi, phong thủy. Một mức giá cho cả nhịp 12 tháng, hợp người xem lịch và lá số đều đặn. Mua một lần, không gia hạn tự động.",
    priceLabel: "989.000₫",
  },
];
