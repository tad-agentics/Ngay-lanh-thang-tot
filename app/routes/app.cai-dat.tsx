import { Link } from "react-router";

import { Button } from "~/components/ui/button";
import { useAuth } from "~/lib/auth";
import { useProfile } from "~/hooks/useProfile";

export default function AppCaiDat() {
  const { user, signOut } = useAuth();
  const { profile, loading } = useProfile();

  return (
    <main className="min-h-svh bg-background px-4 py-10 max-w-lg mx-auto space-y-8">
      <div>
        <p className="text-sm text-muted-foreground mb-1">
          <Link to="/app" className="underline-offset-4 hover:underline">
            ← Trang chủ app
          </Link>
        </p>
        <h1 className="text-2xl font-semibold font-[family-name:var(--font-lora)]">
          Cài đặt
        </h1>
      </div>
      <section className="rounded-xl border border-border bg-card p-4 space-y-2 text-sm">
        <p>
          <span className="text-muted-foreground">Email</span>
          <br />
          <span className="break-all">{user?.email}</span>
        </p>
        {loading ? (
          <p className="text-muted-foreground">Đang tải…</p>
        ) : profile ? (
          <>
            <p>
              <span className="text-muted-foreground">Lượng</span>
              <br />
              <strong>{profile.credits_balance}</strong>
            </p>
            {profile.subscription_expires_at ? (
              <p>
                <span className="text-muted-foreground">Gói đang dùng đến</span>
                <br />
                {new Date(profile.subscription_expires_at).toLocaleDateString(
                  "vi-VN",
                )}
              </p>
            ) : null}
          </>
        ) : null}
      </section>
      <Button variant="outline" asChild className="w-full">
        <Link to="/app/mua-luong">Mua lượng / gói</Link>
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={() => void signOut()}
      >
        Đăng xuất
      </Button>
    </main>
  );
}
