import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { Logo } from "~/components/brand";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { supabase } from "~/lib/supabase";

export default function DatLaiMatKhauRoute() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || password.length < 8) {
      toast.error("Mật khẩu cần ít nhất 8 ký tự.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Đã đặt mật khẩu mới.");
    navigate("/lich", { replace: true });
  }

  return (
    <main
      className="flex min-h-[100svh] flex-col px-6 py-10"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, #2a4738 0%, #1d3129 50%, #0e1c14 100%)",
        color: "var(--cream)",
      }}
    >
      <Logo dark />
      <h1 className="mt-8 font-[family-name:var(--font-display)] text-xl font-extrabold uppercase">
        Đặt lại mật khẩu
      </h1>
      <form className="mt-6 flex w-full max-w-sm flex-col gap-4" onSubmit={(e) => void submit(e)}>
        <Input
          type="password"
          autoComplete="new-password"
          placeholder="Mật khẩu mới"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="min-h-[44px] bg-[rgba(0,0,0,0.2)] text-cream"
        />
        <Button
          type="submit"
          disabled={busy}
          className="min-h-[44px] border-0 uppercase tracking-widest"
          style={{
            background: "var(--cream)",
            color: "var(--ink)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
          }}
        >
          {busy ? "Đang lưu…" : "Lưu mật khẩu"}
        </Button>
      </form>
      {!token ? (
        <p className="mt-4 font-serif text-xs text-[rgba(237,231,211,0.55)]">
          Mở liên kết từ email để hoàn tất.
        </p>
      ) : null}
      <Link
        to="/dang-nhap"
        className="mt-6 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--gold)]"
      >
        Về đăng nhập
      </Link>
    </main>
  );
}
