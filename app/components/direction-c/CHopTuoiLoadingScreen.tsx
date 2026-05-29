import { useEffect, useState } from "react";

import { Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";

const PHASES = [
  "Đối chiếu tứ trụ hai người",
  "Phân tích Thiên Can · Địa Chi",
  "Chấm điểm theo mối quan hệ",
  "Tổng hợp luận giải",
] as const;

type CHopTuoiLoadingScreenProps = {
  purposeLabel?: string | null;
};

/** Direction C — hợp tuổi loading overlay (parity CPickLoading). */
export function CHopTuoiLoadingScreen({
  purposeLabel,
}: CHopTuoiLoadingScreenProps) {
  const [phase, setPhase] = useState(0);
  const accent = purposeLabel?.trim() || "hợp tuổi";

  useEffect(() => {
    const id = window.setInterval(() => {
      setPhase((p) => (p + 1) % PHASES.length);
    }, 900);
    return () => window.clearInterval(id);
  }, []);

  const progress = ((phase + 1) / PHASES.length) * 100;

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 py-10 text-center">
        <div className="relative h-[110px] w-[100px]">
          <div
            className="absolute left-1.5 top-1.5 h-[100px] w-[88px]"
            style={{ background: "#e1d8b8", boxShadow: "0 6px 12px rgba(0,0,0,0.06)" }}
          />
          <div
            className="absolute left-[3px] top-[3px] h-[100px] w-[88px]"
            style={{ background: "#e8dec1", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}
          />
          <div
            className="absolute left-0 top-0 flex h-[100px] w-[88px] flex-col bg-white"
            style={{ boxShadow: "0 8px 20px rgba(0,0,0,0.12)" }}
          >
            <div className="pt-1 text-center font-serif text-[9.5px]" style={{ color: CT.muted }}>
              Đang phân tích
            </div>
            <div className="flex flex-1 items-center justify-center">
              <span
                className="animate-pulse text-[56.5px] font-extrabold leading-none tracking-[-0.04em] tabular-nums"
                style={{ fontFamily: "var(--display-2)", color: CT.goldDeep }}
              >
                {String(phase + 1).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>

        <div>
          <Mono style={{ color: CT.goldDeep, fontSize: 10.5, letterSpacing: "0.22em" }}>
            Độ hợp · {accent}
          </Mono>
          <p
            className="mt-2.5 text-[22.5px] font-extrabold uppercase leading-[1.1] tracking-[-0.01em]"
            style={{ fontFamily: "var(--display)", color: CT.ink }}
          >
            Hợp tuổi
          </p>
          <p
            className="mx-auto mt-2 max-w-[280px] text-[14px] leading-snug"
            style={{ color: CT.muted }}
          >
            {PHASES[phase]}
          </p>
        </div>

        <div
          className="relative h-[1.5px] w-[220px] overflow-hidden"
          style={{ background: "rgba(154,124,34,0.18)" }}
        >
          <div
            className="absolute left-0 top-0 bottom-0 transition-all duration-500"
            style={{ width: `${progress}%`, background: CT.goldDeep }}
          />
        </div>

        <Mono style={{ color: CT.muted, fontSize: 9.5, letterSpacing: "0.14em" }}>
          Bước {phase + 1}/{PHASES.length}
        </Mono>
      </div>
    </div>
  );
}
