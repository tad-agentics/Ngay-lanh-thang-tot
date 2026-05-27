import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";

import {
  btnOutlineCream,
  btnPrimaryGold,
  C,
  CForestShell,
  GoogleIcon,
} from "~/components/auth/c-auth-ui";
import { Logo } from "~/components/brand";
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

  useEffect(() => {
    if (searchParams.get("reason") === "expired") {
      toast.message("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
  }, [searchParams]);

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

  return (
    <CForestShell gradientOpacity={0.12}>
      <div
        style={{
          flex: 1,
          padding: "60px 28px 28px",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <Logo dark size={36} />

        <div style={{ marginTop: 56 }}>
          <h1
            style={{
              fontFamily: "var(--display)",
              fontWeight: 800,
              fontSize: 44,
              color: C.cream,
              lineHeight: 0.96,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Lập lịch riêng
            <br />
            <span
              style={{
                color: C.gold,
                fontFamily: "var(--serif)",
                fontStyle: "italic",
                fontWeight: 700,
                textTransform: "none",
                letterSpacing: 0,
              }}
            >
              cho mệnh của bạn.
            </span>
          </h1>
          <p
            style={{
              marginTop: 16,
              fontFamily: "var(--serif)",
              fontSize: 14,
              color: "rgba(237,231,211,0.7)",
              lineHeight: 1.55,
              maxWidth: 280,
            }}
          >
            Mỗi ngày một trang — chấm điểm theo lá số tứ trụ riêng. Dùng được
            trên mọi thiết bị.
          </p>
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <Link
            to={signUpHref}
            style={{
              ...btnPrimaryGold,
              textAlign: "center",
              textDecoration: "none",
              display: "block",
              boxSizing: "border-box",
            }}
          >
            Lập lịch — 30 giây
          </Link>
          <button
            type="button"
            disabled={busy}
            onClick={() => void signInGoogle()}
            style={btnOutlineCream}
          >
            <GoogleIcon />
            Tiếp tục với Google
          </button>
          <div
            style={{
              marginTop: 14,
              padding: "12px 0",
              borderTop: "1px solid rgba(237,231,211,0.15)",
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontFamily: "var(--serif)",
                fontSize: 13,
                color: "rgba(237,231,211,0.7)",
              }}
            >
              Đã có lịch?
            </span>
            <Link
              to={emailHref}
              style={{
                fontFamily: "var(--display-2)",
                fontWeight: 700,
                fontSize: 13,
                color: C.gold,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                textDecoration: "none",
              }}
            >
              Mở lịch →
            </Link>
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            fontFamily: "var(--serif)",
            fontSize: 11,
            color: "rgba(237,231,211,0.4)",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Tiếp tục đồng nghĩa với việc bạn chấp nhận
          <br />
          <Link
            to="/dieu-khoan"
            style={{ color: "rgba(237,231,211,0.6)", textDecoration: "none" }}
          >
            Điều khoản
          </Link>
          {" · "}
          <Link
            to="/chinh-sach-bao-mat"
            style={{ color: "rgba(237,231,211,0.6)", textDecoration: "none" }}
          >
            Bảo mật
          </Link>
        </div>
      </div>
    </CForestShell>
  );
}
