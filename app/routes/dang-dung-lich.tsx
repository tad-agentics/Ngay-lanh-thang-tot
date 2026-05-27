import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { C, CForestShell } from "~/components/auth/c-auth-ui";
import { Mono } from "~/components/brand";

const PILLARS = ["Niên", "Nguyệt", "Nhật", "Thời"] as const;
const PILLAR_VALUES = ["Canh Ngọ", "Quý Mùi", "Quý Tỵ", "···"] as const;
const QUOTE =
  '"Trường Lưu Thủy — nước sông dài, hợp người làm việc bền"';

export default function DangDungLichRoute() {
  const navigate = useNavigate();
  const [doneCount, setDoneCount] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const steps = [
      { at: 400, done: 1, prog: 25 },
      { at: 1200, done: 2, prog: 50 },
      { at: 2000, done: 3, prog: 76 },
      { at: 3200, done: 4, prog: 100 },
    ];
    const timers = steps.map(({ at, done, prog }) =>
      window.setTimeout(() => {
        setDoneCount(done);
        setProgress(prog);
      }, at),
    );
    const nav = window.setTimeout(() => {
      navigate("/lich-da-mo", { replace: true });
    }, 3400);
    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(nav);
    };
  }, [navigate]);

  return (
    <CForestShell gradientOpacity={0.16} gradientHeight={320} centered>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          position: "relative",
          padding: "0 28px",
          textAlign: "center",
        }}
      >
        <Mono style={{ color: C.gold, fontSize: 10, letterSpacing: "0.24em" }}>
          Đang dựng lịch của bạn
        </Mono>

        <div style={{ display: "flex", gap: 8 }}>
          {PILLARS.map((p, i) => {
            const done = i < doneCount;
            return (
              <div
                key={p}
                style={{
                  width: 56,
                  padding: "12px 0",
                  textAlign: "center",
                  background: done ? "rgba(197,165,90,0.1)" : "transparent",
                  border: `1px solid ${done ? C.gold : "rgba(237,231,211,0.18)"}`,
                }}
              >
                <Mono
                  style={{
                    color: done ? C.gold : "rgba(237,231,211,0.4)",
                    fontSize: 9,
                  }}
                >
                  {p}
                </Mono>
                <div
                  style={{
                    marginTop: 6,
                    fontFamily: "var(--display-2)",
                    fontWeight: 700,
                    fontSize: 12,
                    color: done ? C.cream : "rgba(237,231,211,0.3)",
                    textTransform: "uppercase",
                    letterSpacing: "-0.005em",
                    lineHeight: 1,
                  }}
                >
                  {done && i < 3 ? PILLAR_VALUES[i] : done ? "···" : "···"}
                </div>
              </div>
            );
          })}
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
              width: `${progress}%`,
              background: C.gold,
              transition: "width 0.4s ease",
            }}
          />
        </div>

        <p
          style={{
            fontFamily: "var(--serif)",
            fontStyle: "italic",
            fontSize: 14,
            color: "rgba(237,231,211,0.6)",
            lineHeight: 1.55,
            maxWidth: 280,
            margin: 0,
          }}
        >
          {QUOTE}
        </p>
      </div>
    </CForestShell>
  );
}
