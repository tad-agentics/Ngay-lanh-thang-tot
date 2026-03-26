import { motion } from "motion/react";
import { Clock, Star } from "lucide-react";
import { Link } from "react-router";

import { cn } from "~/components/ui/utils";

/** Figma Make — kết quả chọn ngày (thẻ A xanh đậm, B/C nền sáng). */
const MK = {
  aBg: "#062C16",
  aBadgeBg: "#C4E8CC",
  aBadgeFg: "#062C16",
  aSolar: "#F5E6C8",
  aMuted: "#9EBF9E",
  aSub: "#B8CFB8",
  bBorder: "#D8D4CC",
  bBg: "#FDFCFA",
  bBadgeBg: "#DCEFE2",
  bBadgeFg: "#1a4d2e",
  cBadgeBg: "#E8E6E0",
  cBadgeFg: "#5c5a54",
} as const;

export interface ResultDayCardProps {
  grade: "A" | "B" | "C";
  dateLabel: string;
  lunarLabel: string;
  truc: string;
  bestHour: string;
  reasons: string[];
  animationIndex: number;
  menh?: string;
  /** If set, shows link to full day detail (Wave 2). */
  detailHref?: string;
}

export function ResultDayCard({
  grade,
  dateLabel,
  lunarLabel,
  truc,
  bestHour,
  reasons,
  animationIndex,
  menh,
  detailHref,
}: ResultDayCardProps) {
  const isGradeA = grade === "A";
  const isB = grade === "B";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={
        isGradeA
          ? { opacity: 1, y: 0, scale: [1, 1.04, 1] }
          : { opacity: 1, y: 0 }
      }
      transition={{
        delay: animationIndex * 0.15,
        duration: isGradeA ? 0.6 : 0.4,
        ease: "easeOut",
      }}
      className={cn(
        "relative overflow-hidden px-4 py-4 rounded-[18px]",
        isGradeA ? "text-[#F5E6C8] shadow-md" : "border bg-white text-foreground",
      )}
      style={
        isGradeA
          ? { backgroundColor: MK.aBg }
          : { borderColor: MK.bBorder, backgroundColor: MK.bBg }
      }
    >
      <div className="relative">
        <div className="flex items-start justify-between gap-2 mb-3">
          <span
            className="inline-flex items-center font-semibold text-[11px] leading-none px-2 py-1 rounded-md"
            style={
              isGradeA
                ? { backgroundColor: MK.aBadgeBg, color: MK.aBadgeFg }
                : isB
                  ? { backgroundColor: MK.bBadgeBg, color: MK.bBadgeFg }
                  : { backgroundColor: MK.cBadgeBg, color: MK.cBadgeFg }
            }
          >
            Hạng {grade}
          </span>
          <span
            className={cn(
              "text-xs text-right shrink-0 max-w-[50%]",
              isGradeA ? "" : "text-muted-foreground",
            )}
            style={{
              fontFamily: "system-ui, sans-serif",
              color: isGradeA ? MK.aMuted : undefined,
            }}
          >
            {truc}
          </span>
        </div>

        <h3
          className="mb-1"
          style={{
            fontFamily: "var(--font-lora), serif",
            fontWeight: 700,
            fontSize: isGradeA ? "1.125rem" : "1.05rem",
            lineHeight: 1.35,
            color: isGradeA ? MK.aSolar : undefined,
          }}
        >
          {dateLabel}
        </h3>
        <p
          className={cn("text-[13px] mb-3", !isGradeA && "text-muted-foreground")}
          style={{
            fontFamily: "system-ui, sans-serif",
            color: isGradeA ? MK.aSub : undefined,
          }}
        >
          {lunarLabel}
        </p>

        <div
          className={cn(
            "flex flex-wrap items-center gap-1.5 mb-1 text-[12px] leading-snug",
            !isGradeA && "text-muted-foreground",
          )}
          style={{
            fontFamily: "system-ui, sans-serif",
            color: isGradeA ? MK.aSub : undefined,
          }}
        >
          <Clock size={13} strokeWidth={1.5} className="shrink-0 opacity-90" />
          <span>
            Giờ tốt: {bestHour}
            {menh ? (
              <>
                {" "}
                · mệnh {menh}
              </>
            ) : null}
          </span>
        </div>

        {reasons.length > 0 ? (
          <div
            className={cn(
              "flex flex-col gap-1.5 mt-3 pt-3 border-t",
              isGradeA ? "border-white/15" : "border-border",
            )}
          >
            {reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-2">
                <Star
                  size={10}
                  className={cn(
                    "shrink-0 mt-0.5",
                    isGradeA ? "text-[#E8D48A]" : "text-muted-foreground",
                  )}
                  fill="currentColor"
                />
                <span
                  className={cn(
                    "text-xs leading-relaxed",
                    isGradeA ? "text-[#E5E0D0]" : "text-muted-foreground",
                  )}
                >
                  {r}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {detailHref ? (
          <p className="mt-3 text-xs">
            <Link
              to={detailHref}
              className={cn(
                "underline underline-offset-4 font-medium",
                isGradeA
                  ? "text-[#E8D48A]"
                  : "text-primary",
              )}
            >
              Chi tiết ngày đầy đủ
            </Link>
          </p>
        ) : null}
      </div>
    </motion.div>
  );
}
