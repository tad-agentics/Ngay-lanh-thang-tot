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
import { isInvalidLoginCredentials } from "~/lib/auth-login-error";
import {
  appendReturnToQuery,
  destinationAfterAuth,
  returnToFromSearchParams,
  stashPendingReturnTo,
} from "~/lib/pending-return-to";
import {
  referralParamFromSearchParams,
  stashPendingReferralCode,
} from "~/lib/pending-referral";
import { supabase } from "~/lib/supabase";

async function resolvePostLoginPath(): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const uid = sessionData.session?.user?.id;
  if (!uid) return "/dang-nhap";
  const { data: prof } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", uid)
    .maybeSingle();
  return destinationAfterAuth(prof?.onboarding_completed_at != null);
}

export default function DangNhapEmail() {
  const navigate = useNavigate();
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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("reason") === "expired") {
      toast.message("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (returnTo) stashPendingReturnTo(returnTo);
  }, [returnTo]);

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
        setPasswordError("Sai mật khẩu");
      } else {
        toast.error(error.message);
      }
      return;
    }
    stashPendingReferralCode(referralFromUrl);
    toast.success("Đã đăng nhập");
    const dest = await resolvePostLoginPath();
    navigate(dest, { replace: true });
    setBusy(false);
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
              fontSize: 12,
              color: C.gold,
              textDecoration: "none",
            }}
          >
            Lập lịch mới
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
        <Mono style={{ color: C.gold, fontSize: 10, letterSpacing: "0.22em" }}>
          Mở lịch của bạn
        </Mono>
        <h1
          style={{
            fontFamily: "var(--display)",
            fontWeight: 800,
            fontSize: 36,
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
            fontSize: 13.5,
            color: "rgba(237,231,211,0.65)",
            lineHeight: 1.55,
          }}
        >
          Lịch của bạn được lưu trên cloud — đăng nhập là thấy ngay trang hôm
          nay.
        </p>

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
                  fontSize: 11.5,
                  color: C.gold,
                  textDecoration: "none",
                }}
              >
                Quên?
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
                    fontSize: 10,
                    letterSpacing: "0.14em",
                  }}
                >
                  {passwordError}
                </Mono>
                <p
                  style={{
                    marginTop: 4,
                    fontFamily: "var(--serif)",
                    fontSize: 12,
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
          Mở lịch của tôi →
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
              fontSize: 10,
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
