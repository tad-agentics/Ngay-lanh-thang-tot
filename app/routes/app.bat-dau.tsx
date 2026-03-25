import { Link } from "react-router";

import { Button } from "~/components/ui/button";

export default function AppBatDau() {
  return (
    <main className="min-h-svh bg-background px-4 py-10 max-w-lg mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold font-[family-name:var(--font-lora)] tracking-tight">
          Chào mừng đến Ngày Lành Tháng Tốt
        </h1>
        <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
          Bạn đã có tài khoản và lượng starter. Bước tiếp theo: tra cứu hôm nay
          / tuần này (miễn phí) hoặc mua thêm lượng / gói khi cần.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild className="w-full sm:flex-1">
          <Link to="/app">Vào trang chủ app</Link>
        </Button>
        <Button asChild variant="outline" className="w-full sm:flex-1">
          <Link to="/app/mua-luong">Mua lượng</Link>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Luồng đầy đủ (lá số, chọn ngày) sẽ được nối ở Wave 2–3.
      </p>
    </main>
  );
}
