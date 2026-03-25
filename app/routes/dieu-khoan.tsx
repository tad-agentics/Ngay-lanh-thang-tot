import { Link } from "react-router";

import { ScreenHeader } from "~/components/ScreenHeader";

const SECTIONS = [
  {
    title: "1. Chấp nhận điều khoản",
    content:
      "Bằng cách sử dụng ứng dụng Ngày Lành Tháng Tốt, bạn đồng ý bị ràng buộc bởi các điều khoản sử dụng này.",
  },
  {
    title: "2. Dịch vụ",
    content:
      "Ứng dụng cung cấp thông tin về lịch âm dương, lá số tứ trụ và gợi ý ngày lành dựa trên phương pháp luận học phương Đông. Thông tin mang tính tham khảo, không phải lời khuyên chuyên nghiệp.",
  },
  {
    title: "3. Lượng và thanh toán",
    content:
      "Lượng là đơn vị nội tệ trong ứng dụng. Sau khi mua, lượng không được hoàn trả. Mỗi tính năng có mức sử dụng lượng khác nhau.",
  },
  {
    title: "4. Sở hữu trí tuệ",
    content:
      "Nội dung, thuật toán và giao diện của ứng dụng là tài sản của Ngày Lành Tháng Tốt. Không sao chép hay phân phối khi chưa có sự đồng ý bằng văn bản.",
  },
  {
    title: "5. Giới hạn trách nhiệm",
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
        "Điều khoản sử dụng dịch vụ Ngày Lành Tháng Tốt — lượng, thanh toán và giới hạn trách nhiệm.",
    },
  ];
}

export default function DieuKhoanRoute() {
  return (
    <main className="min-h-svh bg-background pb-8">
      <div className="px-4">
        <ScreenHeader title="Điều khoản sử dụng" />
      </div>
      <div className="px-4 flex flex-col gap-5 max-w-lg mx-auto">
        <p className="text-muted-foreground text-xs">
          Hiệu lực từ: 1 tháng 1, 2026
        </p>
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <h2 className="text-foreground font-medium mb-2 text-sm">
              {s.title}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
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
