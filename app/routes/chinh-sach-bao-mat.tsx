import { Link } from "react-router";

import { ScreenHeader } from "~/components/ScreenHeader";

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
    <main className="min-h-svh bg-background pb-8">
      <div className="px-4">
        <ScreenHeader title="Chính sách bảo mật" />
      </div>
      <div className="px-4 flex flex-col gap-5 max-w-lg mx-auto">
        <p className="text-muted-foreground text-xs">
          Cập nhật lần cuối: 23 tháng 3, 2026
        </p>
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <h2 className="text-foreground font-medium mb-2 text-sm">
              {s.title}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
              {s.content}
            </p>
          </div>
        ))}
        <p className="text-sm text-muted-foreground pt-2">
          <Link to="/" className="text-primary underline underline-offset-4">
            Về trang chủ
          </Link>
        </p>
      </div>
    </main>
  );
}
