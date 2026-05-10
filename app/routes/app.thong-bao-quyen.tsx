import { useState, type CSSProperties } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { BackBar, Kanji, Mono } from "~/components/brand";
import { useAuth } from "~/lib/auth";
import { supabase } from "~/lib/supabase";
import { urlBase64ToUint8Array } from "~/lib/web-push";

/**
 * Push permission — forest ceremonial, aligned with b-habit.jsx HBNotifCadence / habit loop.
 */
export default function AppThongBaoQuyen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState<"idle" | "granted" | "denied">("idle");

  async function persistSubscription(sub: PushSubscription) {
    if (!user) return;
    const j = sub.toJSON();
    const key256 = j.keys?.p256dh;
    const auth = j.keys?.auth;
    if (!key256 || !auth) {
      toast.error("Không đọc được khoá đẩy.");
      return;
    }
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint: sub.endpoint,
        p256dh: key256,
        auth,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      },
      { onConflict: "user_id,endpoint" },
    );
    if (error) {
      toast.error(error.message);
    }
  }

  const handleAllow = async () => {
    if (!("Notification" in window)) {
      setState("denied");
      return;
    }
    try {
      const result = await Notification.requestPermission();
      if (result !== "granted") {
        setState("denied");
        return;
      }

      const vapid = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
      if (vapid && "serviceWorker" in navigator && "PushManager" in window) {
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapid),
          });
          await persistSubscription(sub);
        } catch (e) {
          console.error(e);
          toast.message(
            "Đã bật thông báo trình duyệt; đăng ký đẩy PWA sẽ thử lại sau.",
          );
        }
      }

      setState("granted");
      window.setTimeout(() => navigate(-1), 1200);
    } catch {
      setState("denied");
    }
  };

  const btnPrimary: CSSProperties = {
    width: "100%",
    minHeight: 48,
    padding: "14px 20px",
    background: "var(--gold, #c5a55a)",
    color: "var(--ink, #18150e)",
    border: "none",
    fontFamily: "var(--display-2)",
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: "pointer",
  };

  const btnSecondary: CSSProperties = {
    width: "100%",
    minHeight: 48,
    padding: "12px 20px",
    background: "transparent",
    color: "rgba(237,231,211,0.85)",
    border: "1px solid rgba(197,165,90,0.45)",
    fontFamily: "var(--display-2)",
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        minHeight: "100%",
        background:
          "radial-gradient(ellipse at 50% 0%, #2a4738 0%, #1d3129 50%, #131f1a 100%)",
        color: "var(--cream, #ede7d3)",
        fontFamily: "var(--serif)",
        paddingBottom: 32,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Kanji
        ch="告"
        size={160}
        drift
        style={{
          position: "absolute",
          right: "-40px",
          top: "120px",
          color: "rgba(197,165,90,0.08)",
          pointerEvents: "none",
        }}
      />

      <BackBar dark title="Thông báo" />

      <div className="px-5 pt-4" style={{ position: "relative" }}>
        <Mono style={{ color: "rgba(237,231,211,0.55)" }}>Nhắc đúng lúc</Mono>
        <h1
          style={{
            fontFamily: "var(--display-2)",
            fontWeight: 800,
            fontSize: 22,
            letterSpacing: "-0.02em",
            margin: "10px 0 14px",
            lineHeight: 1.2,
          }}
        >
          {state === "granted"
            ? "Đã bật thông báo"
            : state === "denied"
              ? "Thông báo bị chặn"
              : "Nhận nhắc đúng lúc"}
        </h1>

        {state === "granted" ? (
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.55,
              color: "rgba(237,231,211,0.82)",
              margin: "0 0 28px",
              maxWidth: "22rem",
            }}
          >
            Bạn sẽ nhận nhắc mùa cưới, Tết, đầu tháng.
          </p>
        ) : state === "denied" ? (
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.55,
              color: "rgba(237,231,211,0.75)",
              margin: "0 0 28px",
              maxWidth: "22rem",
            }}
          >
            Vào cài đặt hệ thống để bật lại cho ứng dụng.
          </p>
        ) : (
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.55,
              color: "rgba(237,231,211,0.75)",
              margin: "0 0 28px",
              maxWidth: "22rem",
            }}
          >
            Bật thông báo để nhận nhắc mùa cưới, Tết, đầu tháng — đúng lúc cần
            chọn ngày.
          </p>
        )}

        {state === "idle" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button type="button" onClick={() => void handleAllow()} style={btnPrimary}>
              Cho phép thông báo
            </button>
            <button type="button" onClick={() => navigate(-1)} style={btnSecondary}>
              Để sau
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => navigate(-1)} style={btnSecondary}>
            Quay lại
          </button>
        )}
      </div>
    </div>
  );
}
