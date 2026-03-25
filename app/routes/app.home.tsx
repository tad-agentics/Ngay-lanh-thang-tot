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
            Ứng dụng
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

      <section className="rounded-xl border border-border bg-card p-4 text-sm space-y-2">
        <p className="font-medium">Trạng thái foundation</p>
        {loading ? (
          <p className="text-muted-foreground">Đang tải hồ sơ…</p>
        ) : profile ? (
          <p className="text-muted-foreground">
            Số dư lượng:{" "}
            <strong className="text-foreground">{profile.credits_balance}</strong>
          </p>
        ) : (
          <p className="text-muted-foreground">
            Chưa có dòng profiles — kiểm tra trigger auth hoặc đăng nhập lại.
          </p>
        )}
        <p className="text-muted-foreground pt-2">
          Màn hình tra cứu (Hôm nay, Chọn ngày, …) sẽ được nối ở Wave 2.
        </p>
      </section>

      <Button variant="secondary" asChild className="w-full">
        <Link to="/">Về landing</Link>
      </Button>
    </main>
  );
}
