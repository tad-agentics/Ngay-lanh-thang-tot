import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { supabase } from "~/lib/supabase";

const SESSION_WAIT_MS = 15_000;

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Đang đăng nhập…");

  useEffect(() => {
    let active = true;
    let settled = false;

    const goApp = () => {
      if (!active || settled) return;
      settled = true;
      navigate("/app", { replace: true });
    };

    const goLogin = (msg: string) => {
      if (!active || settled) return;
      settled = true;
      setMessage(msg);
      navigate("/dang-nhap", { replace: true });
    };

    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error");
    const oauthDesc = params.get("error_description");
    if (oauthError) {
      goLogin(
        oauthDesc?.replace(/\+/g, " ") ??
          oauthError ??
          "Đăng nhập không thành công.",
      );
      return () => {
        active = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) goApp();
    });

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active || settled) return;
        if (error) {
          goLogin(error.message);
          return;
        }
        if (data.session) {
          goApp();
        }
      })
      .catch((e) => {
        if (!active || settled) return;
        goLogin(
          e instanceof Error
            ? e.message
            : "Lỗi mạng khi lấy phiên đăng nhập.",
        );
      });

    const t = window.setTimeout(() => {
      if (!active || settled) return;
      void supabase.auth.getSession().then(({ data, error }) => {
        if (!active || settled) return;
        if (error) {
          goLogin(error.message);
          return;
        }
        if (data.session) {
          goApp();
        } else {
          goLogin("Không lấy được phiên. Thử đăng nhập lại.");
        }
      });
    }, SESSION_WAIT_MS);

    return () => {
      active = false;
      window.clearTimeout(t);
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <main className="min-h-svh flex items-center justify-center bg-background px-4">
      <p className="text-sm text-muted-foreground">{message}</p>
    </main>
  );
}
