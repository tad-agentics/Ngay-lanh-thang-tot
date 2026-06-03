import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import {
  authEmailSecondary,
  authEmailSecondaryLink,
  btnPrimaryGold,
  C,
  CForestShell,
  GoogleIcon,
} from "~/components/auth/c-auth-ui";
import { Logo } from "~/components/brand";
import { mapAuthErrorMessageVi } from "~/lib/auth-login-error";
import { authCallbackRedirectUrl } from "~/lib/auth-callback-url";
import { resolvePostLoginPath } from "~/lib/auth-post-login";
import { useAuth } from "~/lib/auth";
import {
  appendReturnToQuery,
  returnToFromSearchParams,
  stashPendingReturnTo,
} from "~/lib/pending-return-to";
import {
  referralParamFromSearchParams,
  stashPendingReferralCode,
} from "~/lib/pending-referral";
import { supabase } from "~/lib/supabase";

export default function DangNhap() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const referralFromUrl = useMemo(
    () => referralParamFromSearchParams(searchParams),
    [searchParams],
  );
  const returnTo = useMemo(
    () => returnToFromSearchParams(searchParams),
    [searchParams],
  );
  const signUpHref = appendReturnToQuery(
    referralFromUrl
      ? `/dang-ky?ref=${encodeURIComponent(referralFromUrl)}`
      : "/dang-ky",
    returnTo,
  );
  const emailHref = appendReturnToQuery(
    referralFromUrl
      ? `/dang-nhap/email?ref=${encodeURIComponent(referralFromUrl)}`
      : "/dang-nhap/email",
    returnTo,
  );

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (searchParams.get("reason") === "expired") {
      toast.message("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (returnTo) stashPendingReturnTo(returnTo);
  }, [returnTo]);

  useEffect(() => {
    if (authLoading || !user) return;
    void resolvePostLoginPath().then((dest) => {
      if (dest !== "/dang-nhap") {
        navigate(dest, { replace: true });
      }
    });
  }, [authLoading, user, navigate]);

  async function signInGoogle() {
    stashPendingReferralCode(referralFromUrl);
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: authCallbackRedirectUrl(),
      },
    });
    setBusy(false);
    if (error) toast.error(mapAuthErrorMessageVi(error.message));
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
              fontSize: 44.5,
              color: C.cream,
              lineHeight: 0.96,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Lập lá số riêng
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
              cho bản mệnh.
            </span>
          </h1>
          <p
            style={{
              marginTop: 16,
              fontFamily: "var(--serif)",
              fontSize: 14.5,
              color: "rgba(237,231,211,0.7)",
              lineHeight: 1.55,
              maxWidth: 280,
            }}
          >
            Mỗi ngày một trang lịch lành — tính cát hung và luận giải chi tiết dựa trên lá số Bát Tự Tứ Trụ riêng biệt.
          </p>
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <button
            type="button"
            disabled={busy}
            onClick={() => void signInGoogle()}
            style={{
              ...btnPrimaryGold,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <GoogleIcon />
            Tiếp tục với Google
          </button>
          <p style={authEmailSecondary}>
            <Link to={emailHref} style={authEmailSecondaryLink}>
              Đăng nhập bằng email
            </Link>
            {" · "}
            <Link to={signUpHref} style={authEmailSecondaryLink}>
              Đăng ký bằng email
            </Link>
          </p>
        </div>

        <div
          style={{
            marginTop: 18,
            fontFamily: "var(--serif)",
            fontSize: 11.5,
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
