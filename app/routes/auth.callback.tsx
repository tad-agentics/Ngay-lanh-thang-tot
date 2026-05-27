import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { C, CForestShell } from "~/components/auth/c-auth-ui";
import { LogoMark, Mono } from "~/components/brand";
import { supabase } from "~/lib/supabase";

const SESSION_WAIT_MS = 15_000;

export default function AuthCallback() {
  const navigate = useNavigate();
  const [progress] = useState("60%");

  useEffect(() => {
    let active = true;
    let settled = false;

    const goAuthed = (path: string) => {
      if (!active || settled) return;
      settled = true;
      navigate(path, { replace: true });
    };

    const resolveDestination = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id;
      if (!uid) {
        goAuthed("/dang-nhap");
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

    const goLogin = () => {
      if (!active || settled) return;
      settled = true;
      navigate("/dang-nhap", { replace: true });
    };

    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error");
    const oauthDesc = params.get("error_description");
    if (oauthError) {
      toast.error(
        oauthDesc?.replace(/\+/g, " ") ??
          oauthError ??
          "Đăng nhập không thành công.",
      );
      goLogin();
      return () => {
        active = false;
      };
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
          goLogin();
          return;
        }
        if (data.session) {
          void resolveDestination();
        }
      })
      .catch(() => {
        if (!active || settled) return;
        goLogin();
      });

    const t = window.setTimeout(() => {
      if (!active || settled) return;
      void supabase.auth
        .getSession()
        .then(({ data, error }) => {
          if (!active || settled) return;
          if (error) {
            goLogin();
            return;
          }
          if (data.session) {
            void resolveDestination();
          } else {
            goLogin();
          }
        })
        .catch(() => {
          if (!active || settled) return;
          goLogin();
        });
    }, SESSION_WAIT_MS);

    return () => {
      active = false;
      window.clearTimeout(t);
      subscription.unsubscribe();
    };
  }, [navigate]);

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
