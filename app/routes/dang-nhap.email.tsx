import { useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { Logo, Mono } from "~/components/brand";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  referralParamFromSearchParams,
  stashPendingReferralCode,
} from "~/lib/pending-referral";
import { supabase } from "~/lib/supabase";

const shell: CSSProperties = {
  background: "radial-gradient(ellipse at 50% 0%, #2a4738 0%, #1d3129 50%, #131f1a 100%)",
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
  borderRadius: "var(--radius-md, 6px)",
};

const linkMuted: CSSProperties = {
  color: "var(--gold, #c5a55a)",
  textDecoration: "underline",
  textUnderlineOffset: 4,
  fontFamily: "var(--serif)",
  fontSize: 14,
  fontStyle: "italic",
};

export default function DangNhapEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralFromUrl = useMemo(
    () => referralParamFromSearchParams(searchParams),
    [searchParams],
  );
  const backHref = referralFromUrl
    ? `/dang-nhap?ref=${encodeURIComponent(referralFromUrl)}`
    : "/dang-nhap";
  const signUpHref = referralFromUrl
    ? `/dang-ky?ref=${encodeURIComponent(referralFromUrl)}`
    : "/dang-ky";
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
    stashPendingReferralCode(referralFromUrl);
    toast.success("Đã đăng nhập");
    navigate("/app", { replace: true });
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
        </Link>
        <div style={{ padding: "6px 4px 0" }}>
          <Mono style={{ color: "var(--gold, #c5a55a)" }} size={11}>
            Đăng nhập
          </Mono>
          <div
            style={{
              fontFamily: "var(--display-2)",
              fontWeight: 800,
              fontSize: 24,
              color: "var(--cream, #ede7d3)",
              marginTop: 4,
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
            }}
          >
            Email & mật khẩu
          </div>
          <div
            style={{
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontSize: 13,
              color: "rgba(200,188,152,0.7)",
              marginTop: 4,
            }}
          >
            Đăng nhập bằng tài khoản đã tạo.
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Label htmlFor="email" style={{ display: "block", margin: 0, padding: 0 }}>
            <Mono style={{ color: "rgba(200,188,152,0.75)" }} size={11}>
              Email
            </Mono>
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
            className="min-w-0"
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
            <Label htmlFor="password" style={{ margin: 0, padding: 0 }}>
              <Mono style={{ color: "rgba(200,188,152,0.75)" }} size={11}>
                Mật khẩu
              </Mono>
            </Label>
            <Link to="/quen-mat-khau" style={linkMuted}>
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
            style={inputStyle}
            className="min-w-0"
          />
        </div>
        <Button type="submit" disabled={busy} className="w-full" style={btnPrimary}>
          Đăng nhập
        </Button>
        <p
          style={{
            textAlign: "center",
            fontFamily: "var(--serif)",
            fontSize: 14,
            color: "rgba(237, 231, 211, 0.78)",
            margin: 0,
          }}
        >
          <Link
            to={backHref}
            style={{ color: "var(--cream, #ede7d3)", textDecoration: "underline", textUnderlineOffset: 4 }}
          >
            Quay lại
          </Link>
          {" · "}
          <Link
            to={signUpHref}
            style={{ color: "var(--cream, #ede7d3)", textDecoration: "underline", textUnderlineOffset: 4 }}
          >
            Đăng ký
          </Link>
        </p>
      </form>
    </main>
  );
}
