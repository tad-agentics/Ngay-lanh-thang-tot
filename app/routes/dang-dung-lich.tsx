import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { C, CForestShell } from "~/components/auth/c-auth-ui";
import { Mono } from "~/components/brand";
import { useProfile } from "~/hooks/useProfile";
import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { extractTuTruPillarLabels } from "~/lib/la-so-ui";

const PILLARS = ["Niên", "Nguyệt", "Nhật", "Thời"] as const;

export default function DangDungLichRoute() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile();
  const [doneCount, setDoneCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [pillarValues, setPillarValues] = useState<string[]>([
    "···",
    "···",
    "···",
    "···",
  ]);
  const [quote, setQuote] = useState(
    '"Đang dựng lịch theo tứ trụ của bạn…"',
  );
  const ranRef = useRef(false);

  useEffect(() => {
    if (profileLoading || !profile || ranRef.current) return;
    const body = profileToBatTuPersonQuery(profile);
    if (!body.birth_date) {
      toast.error("Thiếu ngày sinh trên hồ sơ.");
      navigate("/gio-sinh", { replace: true });
      return;
    }
    ranRef.current = true;

    let cancelled = false;
    const timers: number[] = [];

    void (async () => {
      const res = await invokeBatTu<unknown>({ op: "tu-tru", body });
      if (cancelled) return;
      if (!res.ok) {
        toast.error(res.message ?? "Không lập được lá số.");
        navigate("/gio-sinh", { replace: true });
        return;
      }
      const labels = extractTuTruPillarLabels(res.data);
      setPillarValues(labels);
      const menh = labels[0] !== "···" ? labels[0] : null;
      if (menh) {
        setQuote(`"${menh} — lá số của bạn đã sẵn sàng."`);
      }
      window.dispatchEvent(new Event("ngaytot:profile-refresh"));

      const steps = [
        { at: 400, done: 1, prog: 25 },
        { at: 1200, done: 2, prog: 50 },
        { at: 2000, done: 3, prog: 76 },
        { at: 3200, done: 4, prog: 100 },
      ];
      for (const { at, done, prog } of steps) {
        timers.push(
          window.setTimeout(() => {
            if (cancelled) return;
            setDoneCount(done);
            setProgress(prog);
          }, at),
        );
      }
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) navigate("/lich-da-mo", { replace: true });
        }, 3400),
      );
    })();

    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
    };
  }, [profile, profileLoading, navigate]);

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
                    fontSize: 11,
                    color: done ? C.cream : "rgba(237,231,211,0.3)",
                    textTransform: "uppercase",
                    letterSpacing: "-0.005em",
                    lineHeight: 1.1,
                  }}
                >
                  {done ? pillarValues[i] : "···"}
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
          {quote}
        </p>
      </div>
    </CForestShell>
  );
}
