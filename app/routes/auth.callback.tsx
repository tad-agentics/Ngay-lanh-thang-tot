import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import {
  btnOutlineCream,
  C,
  CForestShell,
} from "~/components/auth/c-auth-ui";
import { LogoMark, Mono } from "~/components/brand";
import {
  AUTH_CALLBACK_VERIFY_FAILED,
  AUTH_CALLBACK_VERIFY_TIMEOUT,
  readOauthCallbackError,
} from "~/lib/auth-login-error";
import { exchangeOAuthCodeFromUrl, resolvePostLoginPath } from "~/lib/auth-post-login";
import { supabase } from "~/lib/supabase";

const SESSION_WAIT_MS = 15_000;

function AuthCallbackErrorView({
  message,
  onBack,
}: {
  message: string;
  onBack: () => void;
}) {
  return (
    <CForestShell gradientOpacity={0.14} centered>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          textAlign: "center",
          padding: "0 32px",
          position: "relative",
          maxWidth: 320,
        }}
      >
        <LogoMark dark size={48} />
        <div>
          <Mono style={{ color: C.red, fontSize: 10.5, letterSpacing: "0.22em" }}>
            Không đăng nhập được
          </Mono>
          <p
            style={{
              marginTop: 12,
              fontFamily: "var(--serif)",
              fontSize: 14.5,
              color: "rgba(237,231,211,0.75)",
              lineHeight: 1.55,
            }}
          >
            {message}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          style={{ ...btnOutlineCream, padding: 14 }}
        >
          Quay lại đăng nhập
        </button>
      </div>
    </CForestShell>
  );
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [verifyError, setVerifyError] = useState<string | null>(
    readOauthCallbackError,
  );
  const [progress] = useState("60%");

  useEffect(() => {
    if (verifyError) return;

    let active = true;
    let settled = false;

    const fail = (message: string) => {
      if (!active || settled) return;
      settled = true;
      setVerifyError(message);
    };

    const goAuthed = (path: string) => {
      if (!active || settled) return;
      settled = true;
      navigate(path, { replace: true });
    };

    const resolveDestination = async () => {
      const dest = await resolvePostLoginPath();
      if (dest === "/dang-nhap") {
        fail(AUTH_CALLBACK_VERIFY_FAILED);
        return;
      }
      goAuthed(dest);
    };

    let cleanup: (() => void) | undefined;

    void (async () => {
      const exchangeError = await exchangeOAuthCodeFromUrl();
      if (!active || settled) return;
      if (exchangeError) {
        fail(AUTH_CALLBACK_VERIFY_FAILED);
        return;
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) void resolveDestination();
      });

      void supabase.auth
        .getSession()
        .then(({ data, error }) => {
          if (!active || settled) return;
          if (error) {
            fail(AUTH_CALLBACK_VERIFY_FAILED);
            return;
          }
          if (data.session) {
            void resolveDestination();
          }
        })
        .catch(() => {
          if (!active || settled) return;
          fail(AUTH_CALLBACK_VERIFY_FAILED);
        });

      const t = window.setTimeout(() => {
        if (!active || settled) return;
        void supabase.auth
          .getSession()
          .then(({ data, error }) => {
            if (!active || settled) return;
            if (error) {
              fail(AUTH_CALLBACK_VERIFY_FAILED);
              return;
            }
            if (data.session) {
              void resolveDestination();
            } else {
              fail(AUTH_CALLBACK_VERIFY_TIMEOUT);
            }
          })
          .catch(() => {
            if (!active || settled) return;
            fail(AUTH_CALLBACK_VERIFY_FAILED);
          });
      }, SESSION_WAIT_MS);

      cleanup = () => {
        window.clearTimeout(t);
        subscription.unsubscribe();
      };
    })();

    return () => {
      active = false;
      cleanup?.();
    };
  }, [navigate, verifyError]);

  if (verifyError) {
    return (
      <AuthCallbackErrorView
        message={verifyError}
        onBack={() => navigate("/dang-nhap", { replace: true })}
      />
    );
  }

  return (
    <CForestShell gradientOpacity={0.14} centered>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          textAlign: "center",
          padding: "0 32px",
          position: "relative",
        }}
      >
        <LogoMark dark size={48} />
        <div>
          <Mono style={{ color: C.gold, fontSize: 10.5, letterSpacing: "0.22em" }}>
            Đang xác minh tài khoản
          </Mono>
          <p
            style={{
              marginTop: 12,
              fontFamily: "var(--serif)",
              fontSize: 14.5,
              color: "rgba(237,231,211,0.7)",
              lineHeight: 1.55,
              maxWidth: 280,
            }}
          >
            Một giây thôi — đang đối chiếu tài khoản với lịch của bạn.
          </p>
        </div>
        <div
          style={{
            width: 200,
            height: 1.5,
            background: "rgba(197,165,90,0.25)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: progress,
              background: C.gold,
            }}
          />
        </div>
      </div>
    </CForestShell>
  );
}
