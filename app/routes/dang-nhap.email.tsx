import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { supabase } from "~/lib/supabase";

export default function DangNhapEmail() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Đã đăng nhập");
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
            Email & mật khẩu
          </h1>
          <p className="text-sm text-muted-foreground">
            Đăng nhập bằng tài khoản đã tạo.
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
          <div className="flex justify-between gap-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Link
              to="/quen-mat-khau"
              className="text-xs text-primary underline-offset-4 hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          Đăng nhập
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/dang-nhap" className="underline-offset-4 hover:underline">
            Quay lại
          </Link>
          {" · "}
          <Link to="/dang-ky" className="underline-offset-4 hover:underline">
            Đăng ký
          </Link>
        </p>
      </form>
    </main>
  );
}
