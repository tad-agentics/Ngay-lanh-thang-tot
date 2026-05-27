import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { btnPrimaryGold, C, CForestShell } from "~/components/auth/c-auth-ui";
import { Mono } from "~/components/brand";
import { useAuth } from "~/lib/auth";
import { supabase } from "~/lib/supabase";

const VI_WEEKDAY = [
  "Chủ Nhật",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
] as const;

export default function LichDaMoRoute() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [finishing, setFinishing] = useState(false);

  const today = useMemo(() => new Date(), []);
  const dayNum = today.getDate();
  const weekday = VI_WEEKDAY[today.getDay()]!;
  const monthYear = today.toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });

  async function openCalendar() {
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
    window.dispatchEvent(new Event("ngaytot:profile-refresh"));
    navigate("/lich", { replace: true });
  }

  return (
    <CForestShell gradientOpacity={0.18}>
      <div
        style={{
          flex: 1,
          padding: "32px 28px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
        }}
      >
        <Mono
          style={{
            color: C.gold,
            fontSize: 10,
            letterSpacing: "0.22em",
            alignSelf: "flex-start",
          }}
        >
          Lịch đã mở
        </Mono>
        <h1
          style={{
            fontFamily: "var(--display)",
            fontWeight: 800,
            fontSize: 38,
            color: C.cream,
            lineHeight: 1,
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            margin: "10px 0 4px",
            alignSelf: "flex-start",
          }}
        >
          Đây là trang
          <br />
          <span
            style={{
              color: C.gold,
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontWeight: 700,
              textTransform: "none",
              letterSpacing: 0,
            }}
          >
            đầu tiên của bạn.
          </span>
        </h1>

        <div
          style={{
            marginTop: 28,
            width: 240,
            background: C.paperWarm,
            color: C.ink,
            transform: "rotate(-2deg)",
            boxShadow: "0 18px 36px rgba(0,0,0,0.32)",
          }}
        >
          <div
            style={{
              padding: "10px 16px 4px",
              fontFamily: "var(--serif)",
              fontSize: 11,
              color: C.muted,
            }}
          >
            {monthYear.charAt(0).toUpperCase() + monthYear.slice(1)}
          </div>
          <div
            style={{
              padding: "4px 16px 10px",
              display: "flex",
              alignItems: "flex-end",
              gap: 10,
            }}
          >
            <div
              style={{
                fontFamily: "var(--display-2)",
                fontWeight: 800,
                fontSize: 84,
                color: C.red,
                lineHeight: 0.85,
                letterSpacing: "-0.045em",
              }}
            >
              {dayNum}
            </div>
            <div
              style={{
                paddingBottom: 8,
                fontFamily: "var(--display)",
                fontWeight: 900,
                fontSize: 22,
                color: C.red,
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
              }}
            >
              {weekday}
            </div>
          </div>
          <div
            style={{
              padding: "8px 16px 12px",
              borderTop: `1px solid ${C.hairline}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <div>
              <Mono style={{ color: C.goldDeep, fontSize: 8 }}>Cho mệnh bạn</Mono>
              <div
                style={{
                  fontFamily: "var(--display-2)",
                  fontWeight: 700,
                  fontSize: 12,
                  color: C.goldDeep,
                  textTransform: "uppercase",
                }}
              >
                Ngày khá
              </div>
            </div>
            <span
              style={{
                fontFamily: "var(--display-2)",
                fontWeight: 800,
                fontSize: 26,
                color: C.goldDeep,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.015em",
              }}
            >
              —
            </span>
          </div>
        </div>

        <p
          style={{
            marginTop: 32,
            fontFamily: "var(--serif)",
            fontStyle: "italic",
            fontSize: 14,
            color: "rgba(237,231,211,0.65)",
            lineHeight: 1.5,
            textAlign: "center",
            maxWidth: 280,
          }}
        >
          Mỗi ngày một trang — đã chấm theo mệnh{" "}
          <strong style={{ color: C.gold, fontWeight: 600 }}>của bạn</strong>.
        </p>

        <button
          type="button"
          disabled={finishing}
          onClick={() => void openCalendar()}
          style={{ ...btnPrimaryGold, marginTop: "auto" }}
        >
          {finishing ? "Đang mở…" : "Vào lịch hôm nay →"}
        </button>
      </div>
    </CForestShell>
  );
}
