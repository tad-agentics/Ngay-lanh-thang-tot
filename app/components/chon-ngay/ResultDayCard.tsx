import { motion } from "motion/react";
import { Clock, Star } from "lucide-react";
import { Link } from "react-router";

import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/components/ui/utils";
import { formatHourRangeForDisplayVi } from "~/lib/format-gio-tot-display-vi";

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
  bestHourSlots?: unknown;
  reasons: string[];
  animationIndex: number;
  menh?: string;
  /** If set, shows link to full day detail (Wave 2). */
  detailHref?: string;
  /** Luận giải LLM trên thẻ (endpoint `chon-ngay-cards`). */
  dayReading?: string | null;
  dayReadingLoading?: boolean;
}

export function ResultDayCard({
  grade,
  dateLabel,
  lunarLabel,
  truc,
  bestHour,
  bestHourSlots,
  reasons,
  animationIndex,
  menh,
  detailHref,
  dayReading = null,
  dayReadingLoading = false,
}: ResultDayCardProps) {
  const isGradeA = grade === "A";
  const isB = grade === "B";
  const bestHourFmtRaw = formatHourRangeForDisplayVi(
    bestHour,
    bestHourSlots,
  );
  const bestHourDisplay =
    bestHourFmtRaw === "—" || !bestHourFmtRaw.trim()
      ? bestHour.trim() || "—"
      : bestHourFmtRaw;

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
          className={cn("text-[13px]", !isGradeA && "text-muted-foreground")}
          style={{
            fontFamily: "system-ui, sans-serif",
            color: isGradeA ? MK.aSub : undefined,
          }}
        >
          {lunarLabel}
        </p>

        {isGradeA ? (
          <>
            <div
              className="flex flex-wrap items-center gap-1.5 mt-3 mb-1 text-[12px] leading-snug"
              style={{
                fontFamily: "system-ui, sans-serif",
                color: MK.aSub,
              }}
            >
              <Clock
                size={13}
                strokeWidth={1.5}
                className="shrink-0 opacity-90"
              />
              <span>
                Giờ tốt: {bestHourDisplay}
                {menh ? (
                  <>
                    {" "}
                    · mệnh {menh}
                  </>
                ) : null}
              </span>
            </div>

            {reasons.length > 0 ? (
              <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-white/15">
                {reasons.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Star
                      size={10}
                      className="shrink-0 mt-0.5 text-[#E8D48A]"
                      fill="currentColor"
                    />
                    <span className="text-xs leading-relaxed text-[#E5E0D0]">
                      {r}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex flex-col gap-2.5 mt-4">
            <div
              className={cn(
                "flex items-start gap-2.5 text-[13px] leading-snug text-muted-foreground",
              )}
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              <Clock
                size={14}
                strokeWidth={1.5}
                className="shrink-0 mt-0.5 text-muted-foreground/80"
              />
              <span>
                Giờ tốt: {bestHourDisplay}
                {menh ? (
                  <>
                    {" "}
                    · mệnh {menh}
                  </>
                ) : null}
              </span>
            </div>
            {reasons.length > 0
              ? reasons.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 text-[13px] leading-relaxed text-muted-foreground"
                    style={{ fontFamily: "system-ui, sans-serif" }}
                  >
                    <Star
                      size={12}
                      className="shrink-0 mt-0.5 text-muted-foreground/70"
                      fill="currentColor"
                    />
                    <span>{r}</span>
                  </div>
                ))
              : null}
          </div>
        )}

        {dayReadingLoading || (dayReading && dayReading.trim()) ? (
          <div
            className={cn(
              "mt-3 pt-3 border-t",
              isGradeA ? "border-white/15" : "border-border/60",
            )}
          >
            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-wide mb-2",
                isGradeA ? "" : "text-muted-foreground",
              )}
              style={{
                fontFamily: "system-ui, sans-serif",
                color: isGradeA ? MK.aMuted : undefined,
              }}
            >
              Luận giải ngày lành
            </p>
            {dayReadingLoading && !(dayReading && dayReading.trim()) ? (
              <div className="flex flex-col gap-2">
                <Skeleton
                  className={cn(
                    "h-3 w-full rounded",
                    isGradeA ? "bg-white/15" : undefined,
                  )}
                />
                <Skeleton
                  className={cn(
                    "h-3 w-[92%] rounded",
                    isGradeA ? "bg-white/12" : undefined,
                  )}
                />
                <Skeleton
                  className={cn(
                    "h-3 w-[78%] rounded",
                    isGradeA ? "bg-white/10" : undefined,
                  )}
                />
              </div>
            ) : (
              <p
                className={cn(
                  "text-[13px] leading-relaxed",
                  isGradeA ? "" : "text-muted-foreground",
                )}
                style={{
                  fontFamily: "system-ui, sans-serif",
                  color: isGradeA ? "#E5E0D0" : undefined,
                }}
              >
                {dayReading?.trim()}
              </p>
            )}
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
