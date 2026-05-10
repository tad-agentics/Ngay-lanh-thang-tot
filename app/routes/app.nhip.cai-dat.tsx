/**
 * /app/nhip/cai-dat — Nhịp / push opt-in (forest).
 */

import { useCallback, useEffect, useState } from "react";

import { BackBar, Kanji, Mono } from "~/components/brand";

const WINDOWS = [
  { label: "Sáng", time: "06:00" },
  { label: "Trưa", time: "13:00" },
  { label: "Chiều", time: "20:00" },
] as const;

function readNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export default function NhipCaiDatRoute() {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">(
    "default",
  );

  const refreshPerm = useCallback(() => {
    setPerm(readNotificationPermission());
  }, []);

  useEffect(() => {
    refreshPerm();
  }, [refreshPerm]);

  return (
    <div
      style={{
        minHeight: "100%",
        background: "radial-gradient(ellipse at 50% 0%, #2a4738 0%, #1d3129 50%, #131f1a 100%)",
        color: "var(--cream, #ede7d3)",
        fontFamily: "var(--serif)",
        paddingBottom: 32,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Kanji
        ch="時"
        size={140}
        drift
        style={{
          position: "absolute",
          left: "-24px",
          bottom: "80px",
          color: "rgba(197,165,90,0.07)",
          pointerEvents: "none",
        }}
      />
      <BackBar dark title="Nhịp · Cài đặt" />

      <div className="px-5 pt-2 space-y-6" style={{ position: "relative" }}>
        <header>
          <h1
            style={{
              fontFamily: "var(--display-2)",
              fontWeight: 800,
              fontSize: 22,
              letterSpacing: "-0.02em",
              marginBottom: 10,
            }}
          >
            3 nhịp mỗi ngày
          </h1>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.55,
              color: "rgba(237,231,211,0.75)",
              margin: 0,
            }}
          >
            Ba thời điểm trong ngày giúp bạn giữ nhịp với lịch. Thời gian gửi khớp với máy chủ —
            bạn chỉ cần cho phép thông báo trên trình duyệt.
          </p>
        </header>

        <section>
          <Mono style={{ color: "rgba(237,231,211,0.58)", marginBottom: 12 }}>
            Khung giờ (chỉ xem)
          </Mono>
          <ul className="space-y-3" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {WINDOWS.map((w) => (
              <li
                key={w.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  background: "rgba(237,231,211,0.06)",
                  border: "1px solid rgba(197,165,90,0.2)",
                }}
              >
                <span style={{ fontFamily: "var(--display-2)", fontWeight: 700, fontSize: 15 }}>
                  {w.label}
                </span>
                <Mono style={{ color: "var(--gold, #c5a55a)" }}>{w.time}</Mono>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <Mono style={{ color: "rgba(237,231,211,0.58)", marginBottom: 12 }}>
            Thông báo đẩy
          </Mono>

          {perm === "unsupported" ? (
            <p style={{ fontSize: 16, color: "rgba(237,231,211,0.72)", margin: 0, lineHeight: 1.55 }}>
              Trình duyệt này không hỗ trợ thông báo đẩy.
            </p>
          ) : perm === "default" ? (
            <button
              type="button"
              onClick={() => void Notification.requestPermission().then(refreshPerm)}
              style={{
                padding: "14px 22px",
                minHeight: 48,
                background: "rgba(197,165,90,0.2)",
                border: "1px solid rgba(197,165,90,0.45)",
                color: "var(--cream, #ede7d3)",
                fontFamily: "var(--display-2)",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Bật thông báo
            </button>
          ) : perm === "granted" ? (
            <p style={{ fontSize: 16, color: "rgba(237,231,211,0.9)", margin: 0, lineHeight: 1.55 }}>
              Thông báo đang bật
            </p>
          ) : (
            <p style={{ fontSize: 16, color: "rgba(237,231,211,0.72)", margin: 0, lineHeight: 1.55 }}>
              Thông báo đã tắt — vào cài đặt trình duyệt để bật lại
            </p>
          )}

          <p
            style={{
              fontSize: 13,
              color: "rgba(237,231,211,0.55)",
              marginTop: 16,
              lineHeight: 1.55,
            }}
          >
            Cài đặt push sẽ được cá nhân hoá trong phiên bản tới.
          </p>
        </section>
      </div>
    </div>
  );
}
