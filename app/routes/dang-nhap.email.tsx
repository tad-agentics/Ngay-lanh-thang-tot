import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import {
  btnOutlineCream,
  btnPrimaryGold,
  C,
  CForestShell,
  GoogleIcon,
  inputLabel,
  inputUnderline,
} from "~/components/auth/c-auth-ui";
import { BackBar, Mono } from "~/components/brand";
import { authCallbackRedirectUrl } from "~/lib/auth-callback-url";
import { resendSignupConfirmationEmail } from "~/lib/auth-email-confirm";
import {
  isInvalidLoginCredentials,
  mapAuthErrorMessageVi,
} from "~/lib/auth-login-error";
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

const CONFIRM_PENDING_TOAST_KEY = "ngaytot:confirm-pending-toast-shown";

export default function DangNhapEmail() {
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
  const backHref = appendReturnToQuery(
    referralFromUrl
      ? `/dang-nhap?ref=${encodeURIComponent(referralFromUrl)}`
      : "/dang-nhap",
    returnTo,
  );
  const signUpHref = appendReturnToQuery(
    referralFromUrl
      ? `/dang-ky?ref=${encodeURIComponent(referralFromUrl)}`
      : "/dang-ky",
    returnTo,
  );

  const emailFromUrl = useMemo(
    () => searchParams.get("email")?.trim() ?? "",
    [searchParams],
  );
  const [email, setEmail] = useState(emailFromUrl);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const confirmPending = searchParams.get("confirm") === "pending";
  const [resendBusy, setResendBusy] = useState(false);

  useEffect(() => {
    if (!confirmPending) return;
    try {
      if (sessionStorage.getItem(CONFIRM_PENDING_TOAST_KEY) === "1") return;
      sessionStorage.setItem(CONFIRM_PENDING_TOAST_KEY, "1");
    } catch {
      /* private mode */
    }
    toast.message(
      "Mở link xác nhận trong email (kiểm tra cả thư rác), sau đó đăng nhập bằng mật khẩu vừa tạo.",
    );
  }, [confirmPending]);

  useEffect(() => {
    if (searchParams.get("reason") === "expired") {
      toast.message("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (returnTo) stashPendingReturnTo(returnTo);
  }, [returnTo]);

  useEffect(() => {
    if (emailFromUrl) setEmail(emailFromUrl);
  }, [emailFromUrl]);

  useEffect(() => {
    if (authLoading || !user) return;
    void resolvePostLoginPath().then((dest) => {
      if (dest !== "/dang-nhap" && dest !== "/dang-nhap/email") {
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setBusy(false);
      if (isInvalidLoginCredentials(error.message)) {
        setPasswordError("Sai email hoặc mật khẩu.");
      } else {
        toast.error(mapAuthErrorMessageVi(error.message));
      }
      return;
    }
    stashPendingReferralCode(referralFromUrl);
    toast.success("Đã đăng nhập");
    const dest = await resolvePostLoginPath();
    navigate(dest, { replace: true });
    setBusy(false);
  }

  async function onResendConfirmation() {
    setResendBusy(true);
    const result = await resendSignupConfirmationEmail(email);
    setResendBusy(false);
    if (result.ok) {
      toast.success("Đã gửi lại email xác nhận.");
    } else {
      toast.error(result.message);
    }
  }

  return (
    <CForestShell>
      <BackBar
        dark
        onBack={() => navigate(backHref)}
        endAdornment={
          <Link
            to={signUpHref}
            style={{
              fontFamily: "var(--serif)",
              fontSize: 12.5,
              color: C.gold,
              textDecoration: "none",
            }}
          >
            Lập lá số mới
          </Link>
        }
      />

      <form
        onSubmit={(e) => void onSubmit(e)}
        style={{
          flex: 1,
          padding: "12px 28px 24px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Mono style={{ color: C.gold, fontSize: 10.5, letterSpacing: "0.22em" }}>
          Mở lịch cát tường của bạn
        </Mono>
        <h1
          style={{
            fontFamily: "var(--display)",
            fontWeight: 800,
            fontSize: 36.5,
            color: C.cream,
            lineHeight: 1,
            textTransform: "uppercase",
            letterSpacing: "-0.015em",
            margin: "12px 0 6px",
          }}
        >
          Đăng nhập
        </h1>
        <p
          style={{
            fontFamily: "var(--serif)",
            fontSize: 14,
            color: "rgba(237,231,211,0.65)",
            lineHeight: 1.55,
          }}
        >
          Lá số và lịch cá nhân của bản chủ được lưu trữ an toàn — đăng nhập để tiếp tục xem ngày cát lành hôm nay.
        </p>

        {confirmPending ? (
          <div
            style={{
              marginTop: 18,
              padding: "12px 14px",
              border: "1px solid rgba(197,165,90,0.45)",
              background: "rgba(197,165,90,0.12)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: "var(--serif)",
                fontSize: 13.5,
                color: "rgba(237,231,211,0.85)",
                lineHeight: 1.55,
              }}
            >
              Chúng tôi đã gửi email xác nhận. Mở link trong thư, sau đó quay lại đây để đăng nhập.
            </p>
            <button
              type="button"
              disabled={resendBusy || !email.trim()}
              onClick={() => void onResendConfirmation()}
              style={{
                marginTop: 10,
                padding: 0,
                border: "none",
                background: "none",
                cursor: resendBusy || !email.trim() ? "default" : "pointer",
                fontFamily: "var(--serif)",
                fontSize: 13,
                color: C.gold,
                textDecoration: "underline",
                opacity: resendBusy || !email.trim() ? 0.5 : 1,
              }}
            >
              {resendBusy ? "Đang gửi lại…" : "Gửi lại email xác nhận"}
            </button>
          </div>
        ) : null}

        <div
          style={{
            marginTop: 28,
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <div>
            <div style={inputLabel}>Email</div>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputUnderline(true)}
            />
          </div>
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <div style={inputLabel}>Mật khẩu</div>
              <Link
                to="/quen-mat-khau"
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 12,
                  color: C.gold,
                  textDecoration: "none",
                }}
              >
                Quên mật khẩu?
              </Link>
            </div>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(null);
              }}
              required
              style={inputUnderline(false, !!passwordError)}
            />
            {passwordError ? (
              <div style={{ marginTop: 8 }}>
                <Mono
                  style={{
                    color: C.red,
                    fontSize: 10.5,
                    letterSpacing: "0.14em",
                  }}
                >
                  {passwordError}
                </Mono>
                <p
                  style={{
                    marginTop: 4,
                    fontFamily: "var(--serif)",
                    fontSize: 12.5,
                    color: "rgba(237,231,211,0.65)",
                    lineHeight: 1.45,
                  }}
                >
                  Kiểm tra lại mật khẩu hoặc dùng Quên? để đặt lại.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          style={{ ...btnPrimaryGold, marginTop: 32 }}
        >
          Đăng nhập & Xem lịch →
        </button>

        <div
          style={{
            marginTop: 28,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{ flex: 1, height: 1, background: "rgba(237,231,211,0.15)" }}
          />
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 10.5,
              color: "rgba(237,231,211,0.4)",
              letterSpacing: "0.18em",
            }}
          >
            HOẶC
          </span>
          <div
            style={{ flex: 1, height: 1, background: "rgba(237,231,211,0.15)" }}
          />
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => void signInGoogle()}
          style={{ ...btnOutlineCream, marginTop: 22 }}
        >
          <GoogleIcon />
          Tiếp tục với Google
        </button>
      </form>
    </CForestShell>
  );
}
