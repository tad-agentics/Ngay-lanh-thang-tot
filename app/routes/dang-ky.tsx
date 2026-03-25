import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { supabase } from "~/lib/supabase";

export default function DangKy() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Mật khẩu cần ít nhất 8 ký tự.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Đã gửi email xác nhận (nếu bật). Kiểm tra hộp thư.");
    navigate("/app", { replace: true });
  }

  return (
    <main className="min-h-svh flex flex-col items-center justify-center bg-background px-4 py-12">
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="w-full max-w-sm space-y-5"
      >
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold font-[family-name:var(--font-lora)]">
            Tạo tài khoản
          </h1>
          <p className="text-sm text-muted-foreground">
            Nhận 20 lượng starter sau khi xác nhận email (theo cấu hình dự án).
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          Đăng ký
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link
            to="/dang-nhap"
            className="text-primary underline-offset-4 hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </form>
    </main>
  );
}
