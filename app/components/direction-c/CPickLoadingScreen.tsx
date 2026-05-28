import { useEffect, useState } from "react";

import { Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";

const PHASES = [
  "Đối chiếu lá số tứ trụ",
  "Lọc ngày dữ chung",
  "Chấm điểm theo mệnh",
  "Sắp xếp ngày tốt nhất",
] as const;

type CPickLoadingScreenProps = {
  intentLabel?: string | null;
  /** G10 — still waiting after slow threshold. */
  slow?: boolean;
  onCancel?: () => void;
};

/** Direction C — tra cứu loading (artboard CPickLoading, 4 phases). */
export function CPickLoadingScreen({
  intentLabel,
  slow = false,
  onCancel,
}: CPickLoadingScreenProps) {
  const [phase, setPhase] = useState(0);
  const accent = intentLabel?.split("·").pop()?.trim() ?? intentLabel ?? "việc của bạn";

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
            <div className="pt-1 text-center font-serif text-[9px]" style={{ color: CT.muted }}>
              Đang quét
            </div>
            <div className="flex flex-1 items-center justify-center">
              <span
                className="animate-pulse font-[family-name:var(--font-display-2)] text-[56px] font-extrabold leading-none tracking-[-0.04em] tabular-nums"
                style={{ color: CT.red }}
              >
                {String(phase + 1).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>

        <div>
          <Mono className="text-[10px] tracking-[0.22em]" style={{ color: CT.goldDeep }}>
            Đang tìm ngày tốt
          </Mono>
          <p
            className="mt-2.5 font-[family-name:var(--font-display)] text-[22px] font-extrabold uppercase leading-[1.1] tracking-[-0.01em]"
            style={{ color: CT.ink }}
          >
            {accent}
          </p>
          <p
            className="mx-auto mt-2 max-w-[280px] text-[13.5px] leading-snug"
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

        <Mono className="text-[9px] tracking-[0.14em]" style={{ color: CT.muted }}>
          Bước {phase + 1}/{PHASES.length}
        </Mono>

        {slow ? (
          <div className="mt-2 flex flex-col items-center gap-3">
            <p className="font-serif text-[13px]" style={{ color: CT.muted }}>
              Vẫn đang tìm…
            </p>
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="cursor-pointer border bg-white px-4 py-2 font-serif text-[13px]"
                style={{ borderColor: CT.hairline, color: CT.ink2 }}
              >
                Huỷ · quay lại form
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
