import { motion } from "motion/react";
import { Clock, Star } from "lucide-react";
import { Link } from "react-router";

import { Chip } from "~/components/Chip";
import { cn } from "~/components/ui/utils";
import { GrainOverlay } from "~/components/GrainOverlay";

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
        "relative overflow-hidden px-4 py-4",
        isGradeA
          ? "bg-surface text-surface-foreground"
          : "border border-border bg-card text-foreground",
      )}
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      {isGradeA ? <GrainOverlay /> : null}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <Chip
            color={isGradeA ? "accent" : grade === "B" ? "success" : "default"}
            variant="flat"
            size="sm"
            radius="sm"
          >
            Hạng {grade}
          </Chip>
          <span
            className={cn(
              "text-xs",
              isGradeA ? "text-surface-foreground/60" : "text-muted-foreground",
            )}
            style={{ fontFamily: "var(--font-ibm-mono)" }}
          >
            {truc}
          </span>
        </div>

        <h3
          className={cn(
            "mb-0.5",
            isGradeA ? "text-surface-foreground" : "text-foreground",
          )}
          style={{
            fontFamily: "var(--font-lora)",
            fontWeight: 600,
            fontSize: "var(--text-base)",
            lineHeight: 1.3,
          }}
        >
          {dateLabel}
        </h3>
        <p
          className={cn(
            "text-xs mb-3",
            isGradeA ? "text-surface-foreground/60" : "text-muted-foreground",
          )}
          style={{ fontFamily: "var(--font-ibm-mono)" }}
        >
          {lunarLabel}
        </p>

        <div
          className={cn(
            "flex items-center gap-1.5 mb-3",
            isGradeA ? "text-accent" : "text-muted-foreground",
          )}
        >
          <Clock size={12} strokeWidth={1.5} />
          <span className="text-xs">Giờ tốt: {bestHour}</span>
          {menh ? (
            <span
              className={cn(
                "text-xs ml-1",
                isGradeA
                  ? "text-surface-foreground/50"
                  : "text-muted-foreground/60",
              )}
            >
              · mệnh {menh}
            </span>
          ) : null}
        </div>

        {reasons.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-2">
                <Star
                  size={10}
                  className={cn(
                    "shrink-0 mt-0.5",
                    isGradeA ? "text-accent" : "text-muted-foreground",
                  )}
                  fill="currentColor"
                />
                <span
                  className={cn(
                    "text-xs leading-relaxed",
                    isGradeA
                      ? "text-surface-foreground/80"
                      : "text-muted-foreground",
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
              className="text-primary underline underline-offset-4"
            >
              Chi tiết ngày đầy đủ
            </Link>
          </p>
        ) : null}
      </div>
    </motion.div>
  );
}
