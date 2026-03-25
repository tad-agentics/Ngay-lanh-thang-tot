import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { supabase } from "~/lib/supabase";

export default function QuenMatKhau() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    );
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Đã gửi liên kết đặt lại mật khẩu.");
  }

  return (
    <main className="min-h-svh flex flex-col items-center justify-center bg-background px-4 py-12">
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="w-full max-w-sm space-y-5"
      >
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold font-[family-name:var(--font-lora)]">
            Quên mật khẩu
          </h1>
          <p className="text-sm text-muted-foreground">
            Nhập email — bạn sẽ nhận liên kết đặt lại mật khẩu.
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
            disabled={sent}
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy || sent}>
          {sent ? "Đã gửi" : "Gửi liên kết"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link
            to="/dang-nhap/email"
            className="underline-offset-4 hover:underline"
          >
            Quay lại đăng nhập
          </Link>
        </p>
      </form>
    </main>
  );
}
