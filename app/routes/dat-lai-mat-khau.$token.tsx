import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import {
  btnOutlineCream,
  btnPrimaryGold,
  C,
  CForestShell,
  inputLabel,
  inputUnderline,
} from "~/components/auth/c-auth-ui";
import { Mono } from "~/components/brand";
import { supabase } from "~/lib/supabase";

export default function DatLaiMatKhauRoute() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;
      setHasSession(!error && !!data.session);
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!password || password.length < 8) {
      toast.error("Mật khẩu cần ít nhất 8 ký tự.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Đã đặt mật khẩu mới.");
    navigate("/dang-nhap/email", { replace: true });
  }

  return (
    <CForestShell>
      <div
        style={{
          flex: 1,
          padding: "48px 28px 24px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Mono style={{ color: C.gold, fontSize: 10.5, letterSpacing: "0.22em" }}>
          Đặt lại mật khẩu
        </Mono>
        <h1
          style={{
            fontFamily: "var(--display)",
            fontWeight: 800,
            fontSize: 32.5,
            color: C.cream,
            lineHeight: 1.05,
            textTransform: "uppercase",
            letterSpacing: "-0.015em",
            margin: "12px 0 6px",
          }}
        >
          Mật khẩu mới
        </h1>

        {checking ? (
          <p
            className="mt-6 font-serif text-sm"
            style={{ color: "rgba(237,231,211,0.65)", lineHeight: 1.55 }}
          >
            Đang mở liên kết từ email…
          </p>
        ) : !hasSession ? (
          <>
            <p
              className="mt-6 font-serif text-sm"
              style={{ color: "rgba(237,231,211,0.65)", lineHeight: 1.55 }}
            >
              Liên kết không hợp lệ hoặc đã hết hạn. Gửi lại từ màn quên mật
              khẩu.
            </p>
            <Link
              to="/quen-mat-khau"
              style={{
                ...btnOutlineCream,
                marginTop: 28,
                padding: 14,
                textAlign: "center",
                textDecoration: "none",
                boxSizing: "border-box",
              }}
            >
              Gửi link mới
            </Link>
          </>
        ) : (
          <form
            onSubmit={(e) => void submit(e)}
            className="mt-6 flex flex-1 flex-col"
          >
            <div>
              <div style={inputLabel}>Mật khẩu mới</div>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                style={inputUnderline(true)}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              style={{ ...btnPrimaryGold, marginTop: 32 }}
            >
              {busy ? "Đang lưu…" : "Lưu mật khẩu"}
            </button>
          </form>
        )}

        <Link
          to="/dang-nhap/email"
          className="mt-auto block pt-6 text-center font-serif text-xs no-underline"
          style={{ color: C.gold }}
        >
          Về đăng nhập
        </Link>
      </div>
    </CForestShell>
  );
}
