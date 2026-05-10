/**
 * ResultDayCard — PickResultLight per b-refresh.jsx §2.
 * Left column: day-of-week + date + score. Right: grade chip + reasoning.
 * Grade A = forest dark left; B/C = warm paper left.
 */

import { motion } from "motion/react";
import { Mono } from "~/components/brand";
import { Skeleton } from "~/components/ui/skeleton";
import { formatHourRangeForDisplayVi } from "~/lib/format-gio-tot-display-vi";

/** Short Vietnamese day abbreviation. */
function shortDayVi(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  const dow = d.getDay(); // 0=Sun
  return ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][dow] ?? "—";
}

function parseDayMonth(isoDate: string): { day: string; month: string } {
  const parts = isoDate.slice(0, 10).split("-");
  return { day: parts[2] ?? "—", month: parts[1] ?? "—" };
}

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
  isoDate: string;
  score?: number | null;
  /** If set, shows link to full day detail. */
  detailHref?: string;
  /** Luận giải LLM trên thẻ (endpoint `chon-ngay-cards`). */
  dayReading?: string | null;
  dayReadingLoading?: boolean;
  onSave?: () => void;
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
  isoDate,
  score,
  detailHref,
  dayReading = null,
  dayReadingLoading = false,
  onSave,
}: ResultDayCardProps) {
  const isFirst = animationIndex === 0;
  const bestHourFmt = formatHourRangeForDisplayVi(bestHour, bestHourSlots);
  const bestHourDisplay =
    bestHourFmt === "—" || !bestHourFmt.trim() ? bestHour.trim() || "—" : bestHourFmt;

  const { day, month } = parseDayMonth(isoDate);
  const dow = shortDayVi(isoDate);

  const positionLabel = isFirst ? "Đề cử nhất" : `Lựa chọn ${animationIndex + 1}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationIndex * 0.12, duration: 0.4, ease: "easeOut" }}
      style={{
        border: "1px solid rgba(154,124,34,0.22)",
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {/* Left: date + score */}
        <div
          style={{
            width: 90,
            background: isFirst ? "#1d3129" : "#f5efe2",
            color: isFirst ? "#ede7d3" : "var(--ink, #1a1a1a)",
            padding: "14px 12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            flexShrink: 0,
          }}
        >
          <Mono size={11} style={{ color: isFirst ? "rgba(237,231,211,0.7)" : "#7a7050", letterSpacing: "0.1em" }}>
            {dow}
          </Mono>
          <div
            style={{
              fontFamily: "var(--display-2)",
              fontWeight: 800,
              fontSize: 26,
              lineHeight: 1,
            }}
          >
            {day}
          </div>
          <Mono size={9} style={{ color: isFirst ? "rgba(237,231,211,0.55)" : "#7a7050", opacity: 0.8 }}>
            tháng {month}
          </Mono>
          <div
            style={{
              height: 1,
              width: "70%",
              background: isFirst ? "rgba(197,165,90,0.5)" : "rgba(154,124,34,0.3)",
              margin: "4px 0",
            }}
          />
          {score != null ? (
            <>
              <div
                style={{
                  fontFamily: "var(--display-2)",
                  fontWeight: 800,
                  fontSize: 22,
                  color: isFirst ? "#c5a55a" : "var(--gold-deep, #7d6219)",
                  lineHeight: 1,
                }}
              >
                {score}
              </div>
              <Mono size={9} style={{ color: isFirst ? "rgba(237,231,211,0.55)" : "#7a7050", opacity: 0.8 }}>
                /100
              </Mono>
            </>
          ) : null}
        </div>

        {/* Right: grade + reasoning */}
        <div style={{ flex: 1, padding: "14px 16px", minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 28,
                height: 22,
                padding: "0 8px",
                background: isFirst ? "#9a7c22" : "rgba(154,124,34,0.15)",
                color: isFirst ? "#ede7d3" : "#9a7c22",
                fontFamily: "var(--display-2)",
                fontWeight: 800,
                fontSize: 12,
                letterSpacing: "0.05em",
              }}
            >
              {grade}
            </span>
            <Mono size={9.5} style={{ color: "#7a7050", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {positionLabel}
            </Mono>
          </div>

          {/* Date label + lunar */}
          <div
            style={{
              fontFamily: "var(--display-2)",
              fontWeight: 700,
              fontSize: 13,
              color: "var(--ink, #1a1a1a)",
              letterSpacing: "-0.005em",
              textTransform: "uppercase",
              marginBottom: 2,
            }}
          >
            {dateLabel}
          </div>
          {lunarLabel ? (
            <Mono size={9.5} style={{ color: "#7a7050", marginBottom: 6 }}>
              {lunarLabel}
            </Mono>
          ) : null}

          {/* Truc + best hour */}
          <div
            style={{
              fontSize: 12.5,
              color: "#3a3220",
              lineHeight: 1.55,
            }}
          >
            {truc ? <span>{truc} · </span> : null}
            <span>Giờ {bestHourDisplay}</span>
            {menh ? <span> · mệnh {menh}</span> : null}
          </div>

          {/* Reasons */}
          {reasons.length > 0 ? (
            <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
              {reasons.map((r, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 12,
                    color: "#5a5040",
                    lineHeight: 1.5,
                    display: "flex",
                    gap: 6,
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ color: "#9a7c22", flexShrink: 0, marginTop: 1 }}>·</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          ) : null}

          {/* AI reading */}
          {(dayReadingLoading || dayReading) ? (
            <div
              style={{
                marginTop: 10,
                paddingTop: 8,
                borderTop: "1px solid rgba(154,124,34,0.15)",
              }}
            >
              <Mono size={9} style={{ color: "#9a7c22", marginBottom: 5 }}>
                Luận giải ngày lành
              </Mono>
              {dayReadingLoading && !dayReading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <Skeleton className="h-2.5 w-full" />
                  <Skeleton className="h-2.5 w-[85%]" />
                  <Skeleton className="h-2.5 w-[70%]" />
                </div>
              ) : (
                <p style={{ fontSize: 12, color: "#3a3220", lineHeight: 1.6, margin: 0 }}>
                  {dayReading?.trim()}
                </p>
              )}
            </div>
          ) : null}

          {/* Save + detail actions */}
          <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {isFirst && onSave ? (
              <button
                type="button"
                onClick={onSave}
                style={{
                  padding: "6px 12px",
                  background: "#1d3129",
                  color: "#ede7d3",
                  border: "none",
                  fontFamily: "var(--display-2)",
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Lưu vào sổ →
              </button>
            ) : null}
            {detailHref ? (
              <a
                href={detailHref}
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  color: "var(--gold-deep, #7d6219)",
                  letterSpacing: "0.08em",
                  textDecoration: "none",
                  textTransform: "uppercase",
                }}
              >
                Chi tiết →
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
