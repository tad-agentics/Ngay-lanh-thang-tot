import {
  BAZI_READING_SECTION_ORDER,
  BAZI_READING_SECTION_TITLES,
} from "~/lib/bazi-reading-load";

/** Đoạn mẫu cố định — chỉ dùng trên paywall, không gọi LLM. */
const MOCK_PARAGRAPHS: Record<(typeof BAZI_READING_SECTION_ORDER)[number], string> = {
  su_nghiep:
    "Trụ ngày cho thấy xu hướng phát triển theo từng giai đoạn: giai đoạn đầu nên ưu tiên tích lũy kinh nghiệm và uy tín trong môi trường làm việc ổn định. Khoảng giữa vận có cửa thăng tiến hoặc chuyển hướng nghề nếu biết chọn thời điểm và đối tác phù hợp. Nên tránh đổi việc liên tục khi chưa có nền tảng; thay vào đó, tập trung vào một lĩnh vực có thể khai thác lâu dài. Quý nhân trong công việc thường đến từ người trầm tính, có thực lực hơn là người ồn ào.",
  tai_van:
    "Dòng tài theo lá số không thiên về đột biến mà thiên về tích tiểu thành đại: thu nhập ổn định từ nghề chính, có thêm nguồn phụ khi vận hỗ trợ. Cần cẩn trọng với các khoản đầu tư ngắn hạn hoặc lời mời hợp tác chưa rõ nguồn gốc. Thời điểm tích lũy tài sản an toàn thường trùng với các năm hành Thổ và Kim trong đại vận. Chi tiêu nên có kế hoạch; tránh vay mượn để duy trì mặt mạng. Khi tài tinh được kích hoạt, nên ưu tiên thanh lý nợ và dự phòng trước khi mở rộng.",
  suc_khoe:
    "Thể chất tổng quát thiên về nội hàm: cần chú ý hệ tiêu hóa, giấc ngủ và nhịp sinh hoạt đều đặn. Các giai đoạn vận căng thẳng dễ biểu hiện qua mệt mỏi kéo dài hoặc đau đầu, nên chủ động nghỉ ngơi thay vì cố gắng quá mức. Thể dục vừa phải, đi bộ hoặc khí công nhẹ phù hợp hơn luyện tập cường độ cao. Mùa chuyển giao và tháng xung khắc với nhật chủ nên hạn chế thức khuya và đồ uống lạnh. Dưỡng sinh theo mệnh: giữ ấm bụng, ăn uống điều độ, tránh tích tụ lo âu lâu ngày.",
  tinh_duyen:
    "Đường tình duyên thường chậm mà chắc: dễ gặp người phù hợp qua môi trường quen biết hoặc giới thiệu đáng tin, ít khi là tình cờ thoáng qua. Trong hôn nhân cần giữ không gian riêng và giao tiếp thẳng thắn; tránh suy diễn im lặng. Các năm hợp hôn nhân thường trùng khi đại vận và lưu niên hỗ trợ Tài và Quan. Nếu độc thân, nên ưu tiên người có tính cách bổ sung hơn giống hệt mình. Gia đình hai bên đóng vai trò quan trọng — hòa hợp với nhà người thân giúp vận tình ổn định lâu dài.",
};

export type BaziPaywallLockedSection = {
  id: (typeof BAZI_READING_SECTION_ORDER)[number];
  index: number;
  title: string;
  mockText: string;
};

/** Bốn chương sau Tính cách — mock + blur trên paywall. */
export function baziPaywallLockedSections(): BaziPaywallLockedSection[] {
  return BAZI_READING_SECTION_ORDER.slice(1).map((id, i) => ({
    id,
    index: i + 2,
    title: BAZI_READING_SECTION_TITLES[id] ?? id,
    mockText: MOCK_PARAGRAPHS[id],
  }));
}
