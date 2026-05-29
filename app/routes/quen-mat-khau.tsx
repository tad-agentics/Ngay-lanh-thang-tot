import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import {
  btnPrimaryGold,
  C,
  CForestShell,
  inputLabel,
  inputUnderline,
} from "~/components/auth/c-auth-ui";
import { BackBar, Mono } from "~/components/brand";
import { passwordResetRedirectUrl } from "~/lib/auth-password-reset";
import { supabase } from "~/lib/supabase";

export default function QuenMatKhau() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const trimmed = email.trim();
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: passwordResetRedirectUrl(),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate(
      `/quen-mat-khau/da-gui?email=${encodeURIComponent(trimmed)}`,
      { replace: true },
    );
  }

  return (
    <CForestShell>
      <BackBar dark onBack={() => navigate("/dang-nhap/email")} />

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
          Quên mật khẩu
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
          Gửi link đặt lại
          <br />
          qua email
        </h1>
        <p
          style={{
            fontFamily: "var(--serif)",
            fontSize: 14,
            color: "rgba(237,231,211,0.65)",
            lineHeight: 1.55,
          }}
        >
          Lá số của bạn vẫn được lưu — chỉ cần đặt mật khẩu mới là vào lịch lại
          được.
        </p>

        <div style={{ marginTop: 28 }}>
          <div style={inputLabel}>Email đăng ký</div>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputUnderline(true)}
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          style={{ ...btnPrimaryGold, marginTop: 32 }}
        >
          Gửi link đặt lại
        </button>
        <div
          style={{
            marginTop: 14,
            textAlign: "center",
            fontFamily: "var(--serif)",
            fontSize: 13,
            color: "rgba(237,231,211,0.55)",
          }}
        >
          Nhớ ra rồi?{" "}
          <Link
            to="/dang-nhap/email"
            style={{ color: C.gold, textDecoration: "none" }}
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </form>
    </CForestShell>
  );
}
