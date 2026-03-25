import { useEffect, useRef, useState } from "react";
import CountUp from "react-countup";
import { motion } from "motion/react";

import { Chip } from "~/components/Chip";

export type HopTuoiGradLabel =
  | "Rất hợp"
  | "Hợp"
  | "Trung bình"
  | "Cần lưu ý";

interface HopTuoiResultPanelProps {
  score: number;
  gradLabel: HopTuoiGradLabel;
  naphAm1: string;
  naphAm2: string;
  naphAmRelation: string;
}

function scoreColor(score: number): string {
  if (score >= 85) return "oklch(0.52 0.10 155)";
  if (score >= 70) return "oklch(0.53 0.11 80)";
  return "oklch(0.48 0.04 80)";
}

function gradChipColor(
  label: HopTuoiGradLabel,
): "success" | "warning" | "default" {
  if (label === "Rất hợp" || label === "Hợp") return "success";
  if (label === "Trung bình") return "warning";
  return "default";
}

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** D3: score count-up + ring + grade label fade. */
export function HopTuoiResultPanel({
  score,
  gradLabel,
  naphAm1,
  naphAm2,
  naphAmRelation,
}: HopTuoiResultPanelProps) {
  const [animated, setAnimated] = useState(false);
  const ringRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const offset = animated ? CIRCUMFERENCE * (1 - score / 100) : CIRCUMFERENCE;
  const color = scoreColor(score);

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="relative flex items-center justify-center"
        style={{ width: 120, height: 120 }}
      >
        <svg width={120} height={120} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={60}
            cy={60}
            r={RADIUS}
            fill="none"
            stroke="var(--border)"
            strokeWidth={8}
          />
          <circle
            ref={ringRef}
            cx={60}
            cy={60}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 800ms ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="leading-none"
            style={{
              fontFamily: "var(--font-ibm-mono)",
              fontSize: 32,
              fontWeight: 500,
              color,
            }}
          >
            {animated ? <CountUp end={score} duration={1.2} /> : 0}
          </span>
          <span className="text-muted-foreground text-xs mt-1">/ 100</span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        className="flex flex-col items-center gap-2"
      >
        <Chip color={gradChipColor(gradLabel)} size="md" radius="sm">
          {gradLabel}
        </Chip>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.4 }}
        className="w-full border border-border bg-card px-4 py-3"
        style={{ borderRadius: "var(--radius-md)" }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground text-xs">Nạp Âm</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span
            className="border border-border px-2 py-0.5 text-xs text-foreground"
            style={{ borderRadius: "var(--radius-sm)" }}
          >
            {naphAm1}
          </span>
          <span className="text-muted-foreground text-xs">×</span>
          <span
            className="border border-border px-2 py-0.5 text-xs text-foreground"
            style={{ borderRadius: "var(--radius-sm)" }}
          >
            {naphAm2}
          </span>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {naphAmRelation}
        </p>
      </motion.div>
    </div>
  );
}
