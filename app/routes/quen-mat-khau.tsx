import { useState, type CSSProperties, type FormEvent } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { Logo, Mono } from "~/components/brand";
import { supabase } from "~/lib/supabase";

const shell: CSSProperties = {
  background:
    "radial-gradient(ellipse at 50% 0%, #2a4738 0%, #1d3129 50%, #131f1a 100%)",
  minHeight: "100svh",
  color: "var(--cream, #ede7d3)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "48px 16px",
  boxSizing: "border-box",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  background: "rgba(0,0,0,0.2)",
  border: "1px solid rgba(197,165,90,0.3)",
  borderRadius: "var(--radius-md, 6px)",
  color: "var(--cream, #ede7d3)",
  fontFamily: "var(--serif)",
  fontSize: 16,
  outline: "none",
  boxSizing: "border-box",
  caretColor: "var(--gold, #c5a55a)",
};

const btnPrimary: CSSProperties = {
  width: "100%",
  backgroundColor: "var(--cream, #ede7d3)",
  color: "var(--ink, #18150e)",
  fontFamily: "var(--display-2)",
  fontWeight: 700,
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  border: "none",
  padding: "14px 20px",
  minHeight: 48,
  borderRadius: "var(--radius-md, 6px)",
  cursor: "pointer",
};

const linkMuted: CSSProperties = {
  color: "var(--gold, #c5a55a)",
  textDecoration: "underline",
  textUnderlineOffset: 4,
  fontFamily: "var(--serif)",
  fontSize: 16,
};

const labelStyle: CSSProperties = {
  fontFamily: "var(--mono)",
  fontSize: 12,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "rgba(237,231,211,0.65)",
  display: "block",
  marginBottom: 8,
};

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
    <main style={shell}>
      <form
        onSubmit={(e) => void onSubmit(e)}
        style={{
          width: "100%",
          maxWidth: 384,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <Logo dark size={36} />
          <Mono style={{ color: "rgba(237,231,211,0.55)" }}>
            Đặt lại mật khẩu
          </Mono>
        </Link>

        <div>
          <h1
            style={{
              fontFamily: "var(--display-2)",
              fontWeight: 800,
              fontSize: 22,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              margin: "0 0 10px",
              lineHeight: 1.2,
            }}
          >
            Quên mật khẩu
          </h1>
          <p
            style={{
              fontFamily: "var(--serif)",
              fontSize: 16,
              lineHeight: 1.55,
              color: "rgba(237,231,211,0.78)",
              margin: 0,
            }}
          >
            Nhập email — bạn sẽ nhận liên kết đặt lại mật khẩu.
          </p>
        </div>

        <div>
          <label htmlFor="email" style={labelStyle}>
            Email
          </label>
          <input
            id="email"
            type="email"
            name="reset-email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={sent}
            style={inputStyle}
          />
        </div>

        <button type="submit" style={btnPrimary} disabled={busy || sent}>
          {sent ? "Đã gửi" : busy ? "Đang gửi…" : "Gửi liên kết"}
        </button>

        <p style={{ textAlign: "center", margin: 0 }}>
          <Link to="/dang-nhap/email" style={linkMuted}>
            Quay lại đăng nhập
          </Link>
        </p>
      </form>
    </main>
  );
}
