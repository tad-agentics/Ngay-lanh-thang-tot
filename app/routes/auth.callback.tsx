import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import {
  btnOutlineCream,
  C,
  CForestShell,
} from "~/components/auth/c-auth-ui";
import { LogoMark, Mono } from "~/components/brand";
import { readOauthCallbackError } from "~/lib/auth-login-error";
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
          <Mono style={{ color: C.red, fontSize: 10, letterSpacing: "0.22em" }}>
            Không đăng nhập được
          </Mono>
          <p
            style={{
              marginTop: 12,
              fontFamily: "var(--serif)",
              fontSize: 14,
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
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id;
      if (!uid) {
        fail("Không xác minh được tài khoản Google. Thử lại.");
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("onboarding_completed_at")
        .eq("id", uid)
        .maybeSingle();
      if (prof?.onboarding_completed_at) {
        goAuthed("/lich");
      } else {
        goAuthed("/gio-sinh");
      }
    };

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
          fail("Không xác minh được Google. Thử lại.");
          return;
        }
        if (data.session) {
          void resolveDestination();
        }
      })
      .catch(() => {
        if (!active || settled) return;
        fail("Không xác minh được Google. Thử lại.");
      });

    const t = window.setTimeout(() => {
      if (!active || settled) return;
      void supabase.auth
        .getSession()
        .then(({ data, error }) => {
          if (!active || settled) return;
          if (error) {
            fail("Không xác minh được Google. Thử lại.");
            return;
          }
          if (data.session) {
            void resolveDestination();
          } else {
            fail(
              "Không xác minh được Google trong thời gian chờ. Thử lại.",
            );
          }
        })
        .catch(() => {
          if (!active || settled) return;
          fail("Không xác minh được Google. Thử lại.");
        });
    }, SESSION_WAIT_MS);

    return () => {
      active = false;
      window.clearTimeout(t);
      subscription.unsubscribe();
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
          <Mono style={{ color: C.gold, fontSize: 10, letterSpacing: "0.22em" }}>
            Đang xác minh Google
          </Mono>
          <p
            style={{
              marginTop: 12,
              fontFamily: "var(--serif)",
              fontSize: 14,
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
