import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { BrandLogoMark } from "~/components/BrandLogoMark";
import { Button } from "~/components/ui/button";
import { supabase } from "~/lib/supabase";

export default function DangNhap() {
  const [busy, setBusy] = useState(false);

  async function signInGoogle() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setBusy(false);
    if (error) toast.error(error.message);
  }

  return (
    <main className="min-h-svh flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <Link
          to="/"
          className="flex flex-col items-center gap-2 no-underline text-foreground hover:opacity-90"
        >
          <BrandLogoMark size={56} />
          <span className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">
            Ngày Lành Tháng Tốt
          </span>
        </Link>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold font-[family-name:var(--font-lora)]">
            Đăng nhập
          </h1>
          <p className="text-sm text-muted-foreground">
            Google (khuyên dùng) hoặc email.
          </p>
        </div>
        <Button
          type="button"
          className="w-full"
          disabled={busy}
          onClick={() => void signInGoogle()}
        >
          Tiếp tục với Google
        </Button>
        <Button variant="outline" className="w-full" asChild>
          <Link to="/dang-nhap/email">Đăng nhập bằng email</Link>
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Link to="/dang-ky" className="text-primary underline-offset-4 hover:underline">
            Đăng ký
          </Link>
        </p>
        <p className="text-center text-xs text-muted-foreground">
          <Link to="/" className="underline-offset-4 hover:underline">
            Về trang chủ
          </Link>
        </p>
      </div>
    </main>
  );
}
