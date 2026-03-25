import { Link } from "react-router";

import { Button } from "~/components/ui/button";
import { useProfile } from "~/hooks/useProfile";

export default function AppMuaLuongThanhCong() {
  const { profile, loading } = useProfile();

  return (
    <div className="px-4 pb-8 py-10 space-y-8 text-center">
      <div>
        <h1 className="text-2xl font-semibold font-[family-name:var(--font-lora)]">
          Cảm ơn bạn
        </h1>
        <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
          Nếu thanh toán đã thành công, số lượng hoặc gói sẽ được cập nhật trong
          vài giây (webhook PayOS). Bạn có thể chờ rồi tải lại trang chủ app.
        </p>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải hồ sơ…</p>
      ) : profile ? (
        <div className="rounded-xl border border-border bg-card p-4 text-sm">
          <p className="text-muted-foreground">Số dư hiện tại</p>
          <p className="text-2xl font-semibold text-foreground mt-1">
            {profile.credits_balance} lượng
          </p>
          {profile.subscription_expires_at ? (
            <p className="text-muted-foreground mt-2">
              Gói: đến{" "}
              {new Date(profile.subscription_expires_at).toLocaleDateString(
                "vi-VN",
              )}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild>
          <Link to="/app">Trang chủ app</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/app/mua-luong">Mua thêm</Link>
        </Button>
      </div>
    </div>
  );
}
