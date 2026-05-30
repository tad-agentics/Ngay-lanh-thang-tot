import { CLegalDocumentScreen } from "~/components/direction-c/CLegalDocumentScreen";
import { DirectionCScreenBoundary } from "~/components/direction-c/DirectionCScreenBoundary";

const SECTIONS = [
  {
    title: "Chấp nhận điều khoản",
    content:
      "Bằng cách sử dụng ứng dụng Ngày Lành Tháng Tốt, bạn đồng ý bị ràng buộc bởi các điều khoản sử dụng này.",
  },
  {
    title: "Dịch vụ",
    content:
      "Ứng dụng cung cấp thông tin về lịch âm dương, lá số tứ trụ và gợi ý ngày lành dựa trên phương pháp luận học phương Đông. Thông tin mang tính tham khảo, không phải lời khuyên chuyên nghiệp.",
  },
  {
    title: "Gói lịch và thanh toán",
    content:
      "Dịch vụ bán theo gói thời hạn (tháng, 6 tháng, năm) và gói luận giải bổ sung qua PayOS. Thanh toán một lần, không tự gia hạn. Chính sách hoàn tiền trong 7 ngày theo quy định từng giao dịch.",
  },
  {
    title: "Sở hữu trí tuệ",
    content:
      "Nội dung, thuật toán và giao diện của ứng dụng là tài sản của Ngày Lành Tháng Tốt. Không sao chép hay phân phối khi chưa có sự đồng ý bằng văn bản.",
  },
  {
    title: "Giới hạn trách nhiệm",
    content:
      "Chúng tôi không chịu trách nhiệm về bất kỳ thiệt hại nào phát sinh từ việc sử dụng hoặc không thể sử dụng ứng dụng.",
  },
] as const;

export function meta() {
  return [
    { title: "Điều khoản sử dụng — Ngày Lành Tháng Tốt" },
    {
      name: "description",
      content:
        "Điều khoản sử dụng dịch vụ Ngày Lành Tháng Tốt — gói lịch, thanh toán và giới hạn trách nhiệm.",
    },
  ];
}

export default function DieuKhoanRoute() {
  return (
    <DirectionCScreenBoundary screen="Điều khoản">
      <CLegalDocumentScreen
        title="Điều khoản sử dụng"
        updatedLabel="Hiệu lực từ: 1 tháng 1, 2026"
        sections={SECTIONS}
      />
    </DirectionCScreenBoundary>
  );
}
