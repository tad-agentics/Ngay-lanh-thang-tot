import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { btnOutlineCream, C, CForestShell } from "~/components/auth/c-auth-ui";
import { BackBar, Mono } from "~/components/brand";
import { supabase } from "~/lib/supabase";

const RESEND_COOLDOWN_SEC = 30;

export default function QuenMatKhauDaGuiRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = useMemo(
    () => searchParams.get("email")?.trim() ?? "",
    [searchParams],
  );
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SEC);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => window.clearInterval(t);
  }, [cooldown]);

  async function resend() {
    if (!email || cooldown > 0 || resending) return;
    setResending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dat-lai-mat-khau/recovery`,
    });
    setResending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Đã gửi lại link.");
    setCooldown(RESEND_COOLDOWN_SEC);
  }

  return (
    <CForestShell>
      <BackBar dark onBack={() => navigate("/quen-mat-khau")} />

      <div
        style={{
          flex: 1,
          padding: "12px 28px 24px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Mono style={{ color: C.gold, fontSize: 10, letterSpacing: "0.22em" }}>
          Đã gửi
        </Mono>
        <h1
          style={{
            fontFamily: "var(--display)",
            fontWeight: 800,
            fontSize: 32,
            color: C.cream,
            lineHeight: 1.05,
            textTransform: "uppercase",
            letterSpacing: "-0.015em",
            margin: "12px 0 6px",
          }}
        >
          Kiểm tra hộp thư
          <br />
          của bạn
        </h1>
        <p
          style={{
            fontFamily: "var(--serif)",
            fontSize: 13.5,
            color: "rgba(237,231,211,0.65)",
            lineHeight: 1.55,
          }}
        >
          Link đặt lại mật khẩu đã gửi đến
          <br />
          {email ? (
            <strong style={{ color: C.cream, fontWeight: 600 }}>{email}</strong>
          ) : (
            <strong style={{ color: C.cream, fontWeight: 600 }}>
              email của bạn
            </strong>
          )}
          . Hộp thư có thể mất 1–2 phút.
        </p>

        <div style={{ marginTop: 40, alignSelf: "center" }}>
          <svg width="80" height="60" viewBox="0 0 80 60" fill="none" aria-hidden>
            <rect
              x="2"
              y="6"
              width="76"
              height="48"
              stroke={C.gold}
              strokeWidth="1.2"
              fill="rgba(197,165,90,0.04)"
            />
            <path
              d="M2 6 L40 36 L78 6"
              stroke={C.gold}
              strokeWidth="1.2"
              fill="none"
            />
          </svg>
        </div>

        <div
          style={{
            marginTop: 40,
            padding: "12px 14px",
            background: "rgba(197,165,90,0.06)",
            borderLeft: `2px solid ${C.gold}`,
            fontFamily: "var(--serif)",
            fontSize: 12.5,
            color: "rgba(237,231,211,0.75)",
            lineHeight: 1.55,
          }}
        >
          Không thấy email? Kiểm tra mục{" "}
          <strong style={{ color: C.cream, fontWeight: 600 }}>spam</strong>{" "}
          hoặc{" "}
          {cooldown > 0 ? (
            <span style={{ color: "rgba(237,231,211,0.55)" }}>
              gửi lại sau {cooldown} giây
            </span>
          ) : (
            <button
              type="button"
              onClick={() => void resend()}
              disabled={!email || resending}
              style={{
                color: C.gold,
                background: "none",
                border: "none",
                padding: 0,
                font: "inherit",
                cursor: email ? "pointer" : "default",
              }}
            >
              gửi lại
            </button>
          )}
          .
        </div>

        <Link
          to="/dang-nhap/email"
          style={{
            ...btnOutlineCream,
            marginTop: "auto",
            padding: 14,
            textAlign: "center",
            textDecoration: "none",
            boxSizing: "border-box",
          }}
        >
          Quay lại đăng nhập
        </Link>
      </div>
    </CForestShell>
  );
}
