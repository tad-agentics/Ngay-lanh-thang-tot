import { Link } from "react-router";

import { useAuth } from "~/lib/auth";
import { useProfile } from "~/hooks/useProfile";
import { Button } from "~/components/ui/button";

export default function AppHome() {
  const { user, signOut } = useAuth();
  const { profile, loading } = useProfile();

  return (
    <main className="min-h-svh bg-background px-4 py-10 max-w-lg mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold font-[family-name:var(--font-lora)]">
            Trang chủ
          </h1>
          <p className="text-sm text-muted-foreground mt-1 break-all">
            {user?.email}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void signOut()}
        >
          Đăng xuất
        </Button>
      </header>

      <nav className="grid gap-2">
        <Button variant="secondary" asChild className="justify-start">
          <Link to="/app/hom-nay">Hôm nay (Bát Tự)</Link>
        </Button>
        <Button variant="secondary" asChild className="justify-start">
          <Link to="/app/tuan-nay">Tuần này (Bát Tự)</Link>
        </Button>
        <Button variant="secondary" asChild className="justify-start">
          <Link to="/app/lich-thang">Lịch tháng</Link>
        </Button>
        <Button variant="default" asChild className="justify-start">
          <Link to="/app/chon-ngay">Chọn ngày</Link>
        </Button>
        <Button variant="secondary" asChild className="justify-start">
          <Link to="/app/bat-dau">Bắt đầu / chào mừng</Link>
        </Button>
        <Button variant="secondary" asChild className="justify-start">
          <Link to="/app/mua-luong">Mua lượng / gói</Link>
        </Button>
        <Button variant="outline" asChild className="justify-start">
          <Link to="/app/cai-dat">Cài đặt</Link>
        </Button>
      </nav>

      <section className="rounded-xl border border-border bg-card p-4 text-sm space-y-2">
        <p className="font-medium">Tài khoản</p>
        {loading ? (
          <p className="text-muted-foreground">Đang tải hồ sơ…</p>
        ) : profile ? (
          <>
            <p className="text-muted-foreground">
              Số dư lượng:{" "}
              <strong className="text-foreground">
                {profile.credits_balance}
              </strong>
            </p>
            {profile.subscription_expires_at ? (
              <p className="text-muted-foreground">
                Gói: đến{" "}
                {new Date(profile.subscription_expires_at).toLocaleDateString(
                  "vi-VN",
                )}
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-muted-foreground">
            Chưa có dòng profiles — kiểm tra trigger auth hoặc đăng nhập lại.
          </p>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        Chi tiết từng ngày (sau khi chọn ngày) sẽ bổ sung tiếp trong Wave 2.
      </p>

      <Button variant="ghost" asChild className="w-full">
        <Link to="/">Về landing</Link>
      </Button>
    </main>
  );
}
