import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { supabase } from "~/lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Đang đăng nhập…");

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setMessage(error.message);
        return;
      }
      if (data.session) {
        navigate("/app", { replace: true });
        return;
      }
      setMessage("Không lấy được phiên. Thử đăng nhập lại.");
      navigate("/dang-nhap", { replace: true });
    });
  }, [navigate]);

  return (
    <main className="min-h-svh flex items-center justify-center bg-background px-4">
      <p className="text-sm text-muted-foreground">{message}</p>
    </main>
  );
}
