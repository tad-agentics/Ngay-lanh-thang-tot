import { CLegalDocumentScreen } from "~/components/direction-c/CLegalDocumentScreen";
import { DirectionCScreenBoundary } from "~/components/direction-c/DirectionCScreenBoundary";

const SECTIONS = [
  {
    title: "Thu thập thông tin",
    content:
      "Chúng tôi thu thập thông tin bạn cung cấp khi sử dụng ứng dụng, bao gồm ngày sinh, email và thông tin thanh toán để cung cấp dịch vụ.",
  },
  {
    title: "Sử dụng thông tin",
    content:
      "Thông tin được sử dụng để tính toán lá số tứ trụ, cá nhân hóa kết quả và gửi thông báo. Chúng tôi không bán thông tin cá nhân cho bên thứ ba.",
  },
  {
    title: "Cookie và đo lường quảng cáo",
    content:
      "Chúng tôi dùng cookie cần thiết để đăng nhập và vận hành ứng dụng. Khi bạn chấp nhận trên banner cookie, chúng tôi có thể dùng Meta Pixel (Facebook) để đo lượt truy cập, tối ưu quảng cáo và ghi nhận giao dịch thanh toán thành công (sự kiện PageView, Purchase). Bạn có thể từ chối — các tính năng lịch và luận giải vẫn hoạt động. Dữ liệu do Meta xử lý theo chính sách của Meta.",
  },
  {
    title: "Bảo mật dữ liệu",
    content:
      "Dữ liệu được mã hóa và lưu trữ an toàn. Chúng tôi áp dụng các biện pháp bảo mật tiêu chuẩn ngành để bảo vệ thông tin của bạn.",
  },
  {
    title: "Quyền của người dùng",
    content:
      "Bạn có quyền truy cập, chỉnh sửa hoặc xóa dữ liệu cá nhân bất kỳ lúc nào qua phần Cài đặt hoặc liên hệ chúng tôi.",
  },
  {
    title: "Liên hệ",
    content: "Email: privacy@ngaylanhthangtot.vn\nĐịa chỉ: Hà Nội, Việt Nam",
  },
] as const;

export function meta() {
  return [
    { title: "Chính sách bảo mật — Ngày Lành Tháng Tốt" },
    {
      name: "description",
      content:
        "Cách Ngày Lành Tháng Tốt thu thập, dùng và bảo vệ thông tin cá nhân của bạn.",
    },
  ];
}

export default function ChinhSachBaoMatRoute() {
  return (
    <DirectionCScreenBoundary screen="Chính sách bảo mật">
      <CLegalDocumentScreen
        title="Chính sách bảo mật"
        updatedLabel="Cập nhật lần cuối: 23 tháng 3, 2026"
        sections={SECTIONS}
      />
    </DirectionCScreenBoundary>
  );
}
