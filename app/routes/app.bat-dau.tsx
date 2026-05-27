import { useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { LogoMark } from "~/components/brand";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/lib/auth";
import { useProfile } from "~/hooks/useProfile";
import { subscriptionActive } from "~/lib/subscription";
import { supabase } from "~/lib/supabase";

const shell: CSSProperties = {
  background: "radial-gradient(ellipse at 50% 0%, #2a4738 0%, #1d3129 50%, #131f1a 100%)",
  minHeight: "100svh",
  color: "var(--cream, #ede7d3)",
  display: "flex",
  flexDirection: "column",
  padding: "40px 16px 32px",
  boxSizing: "border-box",
};

const btnPrimary: CSSProperties = {
  width: "100%",
  backgroundColor: "var(--cream, #ede7d3)",
  color: "var(--ink, #18150e)",
  fontFamily: "var(--display-2)",
  fontWeight: 700,
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  border: "none",
  padding: "14px 20px",
  borderRadius: "var(--radius-md, 6px)",
};

const btnOutline: CSSProperties = {
  width: "100%",
  backgroundColor: "transparent",
  color: "var(--cream, #ede7d3)",
  fontFamily: "var(--display-2)",
  fontWeight: 700,
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  border: "1px solid rgba(197, 165, 90, 0.35)",
  padding: "14px 20px",
  borderRadius: "var(--radius-md, 6px)",
};

const linkOnDark: CSSProperties = {
  color: "var(--gold, #c5a55a)",
  textDecoration: "underline",
  textUnderlineOffset: 2,
};

export default function AppBatDau() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading, refresh } = useProfile();
  const [finishing, setFinishing] = useState(false);

  async function enterApp() {
    if (!user) return;
    setFinishing(true);
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("id", user.id);
    setFinishing(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
    navigate("/lich", { replace: true });
  }

  const credits = profile?.credits_balance ?? null;
  const subOn = subscriptionActive(profile?.subscription_expires_at);

  return (
    <main style={shell}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          paddingBottom: 16,
          paddingTop: 24,
          width: "100%",
          maxWidth: 420,
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: 28, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              border: "1px solid rgba(197,165,90,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              overflow: "hidden",
              width: 64,
              height: 64,
              borderRadius: "var(--radius-md, 6px)",
              background: "rgba(0,0,0,0.2)",
            }}
          >
            <LogoMark dark size={64} />
          </div>

          <h1
            style={{
              fontFamily: "var(--display-2)",
              fontWeight: 800,
              fontSize: 28,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              color: "var(--cream, #ede7d3)",
              textAlign: "center",
              margin: "0 0 12px",
              lineHeight: 1.15,
            }}
          >
            Ngày Lành
            <br />
            Tháng Tốt
          </h1>

          <p
            style={{
              fontFamily: "var(--serif)",
              fontSize: 14,
              color: "rgba(237,231,211,0.78)",
              textAlign: "center",
              lineHeight: 1.55,
              margin: 0,
              maxWidth: 280,
            }}
          >
            Chọn ngày lành, hợp tuổi, xem vận — cá nhân hoá hoàn toàn theo bản mệnh của
            bạn.
          </p>
        </div>

        <div
          style={{
            width: "100%",
            border: "1px solid rgba(197,165,90,0.25)",
            background: "rgba(0,0,0,0.18)",
            padding: "14px 16px",
            marginBottom: 24,
            borderRadius: "var(--radius-md, 6px)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--serif)",
              fontSize: 12,
              lineHeight: 1.55,
              color: "rgba(237,231,211,0.88)",
              textAlign: "center",
              margin: 0,
            }}
          >
            {loading ? (
              "Đang tải số dư…"
            ) : subOn ? (
              <>
                Gói của bạn đang{" "}
                <strong style={{ color: "var(--cream, #ede7d3)", fontWeight: 700 }}>
                  không giới hạn lượng
                </strong>
                — dùng tra cứu và chọn ngày thoải mái trong thời hạn gói.
              </>
            ) : credits != null ? (
              <>
                Tài khoản của bạn có{" "}
                <strong style={{ color: "var(--cream, #ede7d3)", fontWeight: 700 }}>
                  {credits}
                </strong>{" "}
                lượng
                — đủ để bắt đầu tra cứu và chọn ngày.
              </>
            ) : (
              "Kiểm tra hồ sơ trong Cài đặt nếu chưa thấy số lượng."
            )}
          </p>
        </div>

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
          <Button
            size="cta_sm"
            disabled={finishing || loading || !profile}
            onClick={() => void enterApp()}
            style={btnPrimary}
            className="border-0 shadow-none"
          >
            {finishing ? "Đang vào…" : "Vào trang chủ app"}
          </Button>

          <Button variant="ghost" size="cta_sm" className="h-auto p-0 hover:bg-transparent" asChild>
            <Link to="/dat-lich" style={{ ...btnOutline, display: "block", textAlign: "center", boxSizing: "border-box" }}>
              Đặt lịch / gia hạn
            </Link>
          </Button>
        </div>
      </div>

      <div style={{ paddingBottom: 8, paddingTop: 16, textAlign: "center" }}>
        <p
          style={{
            fontFamily: "var(--serif)",
            fontSize: 11,
            lineHeight: 1.65,
            color: "rgba(237,231,211,0.55)",
            margin: 0,
          }}
        >
          Điều khoản và chính sách:{" "}
          <Link to="/dieu-khoan" style={linkOnDark}>
            Điều khoản sử dụng
          </Link>
          {" · "}
          <Link to="/chinh-sach-bao-mat" style={linkOnDark}>
            Chính sách bảo mật
          </Link>
          . Trong app:{" "}
          <Link to="/toi/cai-dat" style={linkOnDark}>
            Cài đặt
          </Link>
          . Trang giới thiệu:{" "}
          <Link to="/" style={linkOnDark}>
            ngaylanhthangtot.vn
          </Link>
        </p>
      </div>
    </main>
  );
}
