import { useMemo, useState, type CSSProperties } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";

import { Logo } from "~/components/brand";
import { Button } from "~/components/ui/button";
import {
  referralParamFromSearchParams,
  stashPendingReferralCode,
} from "~/lib/pending-referral";
import { supabase } from "~/lib/supabase";

export default function DangNhap() {
  const [searchParams] = useSearchParams();
  const referralFromUrl = useMemo(
    () => referralParamFromSearchParams(searchParams),
    [searchParams],
  );
  const signUpHref = referralFromUrl
    ? `/dang-ky?ref=${encodeURIComponent(referralFromUrl)}`
    : "/dang-ky";
  const emailHref = referralFromUrl
    ? `/dang-nhap/email?ref=${encodeURIComponent(referralFromUrl)}`
    : "/dang-nhap/email";

  const [busy, setBusy] = useState(false);

  async function signInGoogle() {
    stashPendingReferralCode(referralFromUrl);
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

  const btnOutline: CSSProperties = {
    width: "100%",
    backgroundColor: "transparent",
    color: "var(--cream, #ede7d3)",
    fontFamily: "var(--display-2)",
    fontWeight: 700,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    border: "1px solid rgba(197, 165, 90, 0.35)",
    padding: "14px 20px",
    borderRadius: "var(--radius-md, 6px)",
  };

  const linkStyle: CSSProperties = {
    color: "var(--gold, #c5a55a)",
    textDecoration: "underline",
    textUnderlineOffset: 4,
  };

  return (
    <main style={shell}>
      <div style={{ width: "100%", maxWidth: 384, display: "flex", flexDirection: "column", gap: 24 }}>
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
          <Logo dark size={42} />
        </Link>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 8 }}>
          <h1
            style={{
              fontFamily: "var(--display-2)",
              fontWeight: 800,
              fontSize: 24,
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              color: "var(--cream, #ede7d3)",
              margin: 0,
            }}
          >
            Đăng nhập
          </h1>
          <p
            style={{
              fontFamily: "var(--serif)",
              fontSize: 16,
              color: "rgba(237, 231, 211, 0.72)",
              margin: 0,
            }}
          >
            Google (khuyên dùng) hoặc email.
          </p>
        </div>
        <Button
          type="button"
          disabled={busy}
          onClick={() => void signInGoogle()}
          className="w-full"
          style={btnPrimary}
        >
          Tiếp tục với Google
        </Button>
        <Button variant="ghost" className="w-full p-0 h-auto hover:bg-transparent" asChild>
          <Link to={emailHref} style={{ ...btnOutline, display: "block", textAlign: "center", boxSizing: "border-box" }}>
            Đăng nhập bằng email
          </Link>
        </Button>
        <p style={{ textAlign: "center", fontFamily: "var(--serif)", fontSize: 14, color: "rgba(237, 231, 211, 0.78)", margin: 0 }}>
          Chưa có tài khoản?{" "}
          <Link to={signUpHref} style={linkStyle}>
            Đăng ký
          </Link>
        </p>
        <p style={{ textAlign: "center", fontFamily: "var(--serif)", fontSize: 12, color: "rgba(237, 231, 211, 0.55)", margin: 0 }}>
          <Link to="/" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 4 }}>
            Về trang chủ
          </Link>
        </p>
      </div>
    </main>
  );
}
