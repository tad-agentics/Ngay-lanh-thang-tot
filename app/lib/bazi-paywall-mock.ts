import {
  baziOutlineSections,
  type BaziOutlineKey,
} from "~/lib/bazi-reading-outline";

/** Đoạn mẫu cố định — chỉ dùng trên paywall (chương 03–05). */
const MOCK_BY_KEY: Record<
  Exclude<BaziOutlineKey, "menh_tong_quan" | "tinh_cach">,
  string
> = {
  van_nam:
    "Đánh giá năm: Năm tốt · củng cố. Bính Ngọ — Hỏa vượng so với mệnh Thủy: giai đoạn này nên nuôi dưỡng, củng cố nền tảng — chưa phải lúc mở rộng mạnh. Tài lộc trung bình, tránh đầu tư mạo hiểm; quý 3 âm lịch thuận cho ký kết. Sự nghiệp có cơ hội tiến triển cuối năm; quý nhân thường đến từ phương Bắc. Tình duyên ổn định; sức khỏe cần chú ý tâm–thận, giảm stress và thực phẩm cay nóng.",
  phong_thuy:
    "Hướng tốt cho bạn: Đông Nam (Sinh Khí — tài lộc), Bắc (Diên Niên — sức khỏe), Đông (Thiên Y — quý nhân), Nam (Phục Vị — bình ổn). Tránh Tây Bắc (Tuyệt Mệnh) và Tây Nam (Hoạ Hại). Màu hợp: trắng, xám, xanh đậm, xanh rêu — tránh vàng đậm, nâu, đỏ chói vì Thổ Hỏa khắc mệnh. Sao bay năm: trung cung sao 5 Tử đáo — hạn chế đào xới, sửa chữa giữa nhà trong năm này.",
  quy_nhan:
    "Tuổi hợp: Thân · Tý · Thìn (tam hợp). Tuổi xung: Tỵ · Hợi — nên cẩn trọng khi hợp tác hoặc kết hôn. Đại vận sắp tới có Kim sinh Thủy — đây là thời cơ phát triển sự nghiệp quan trọng nếu biết tận dụng quý nhân và giữ nhịp sinh hoạt ổn định. Tránh cam kết lớn vào tháng xung khắc với nhật chủ.",
};

export type BaziPaywallLockedChapter = {
  key: Exclude<BaziOutlineKey, "menh_tong_quan" | "tinh_cach">;
  index: number;
  title: string;
  mockText: string;
};

export function baziPaywallLockedChapters(yearCanChi: string): BaziPaywallLockedChapter[] {
  const outline = baziOutlineSections(yearCanChi);
  const keys: BaziPaywallLockedChapter["key"][] = [
    "van_nam",
    "phong_thuy",
    "quy_nhan",
  ];
  return keys.map((key) => {
    const meta = outline.find((o) => o.key === key)!;
    return {
      key,
      index: meta.index,
      title: meta.title,
      mockText: MOCK_BY_KEY[key],
    };
  });
}
