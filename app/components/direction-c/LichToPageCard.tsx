import type { ReactNode } from "react";

import { Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";

export type LichRow = {
  key: string;
  value: string;
  color: string;
};

export type LichToPageCardProps = {
  masthead: string;
  dayNumber: string;
  weekday: string;
  lunarLine: ReactNode;
  verdictLabel: string;
  verdictSub?: ReactNode;
  score?: number | null;
  /** Inline NLTT luận — between verdict and Nên/Tránh/Giờ (`c-screens-a` order). */
  reasoning?: ReactNode;
  rows: LichRow[];
  prevLabel?: string;
  nextLabel?: string;
  onPrev?: () => void;
  onNext?: () => void;
  onVerdictClick?: () => void;
};

export function LichToPageCard({
  masthead,
  dayNumber,
  weekday,
  lunarLine,
  verdictLabel,
  verdictSub,
  score,
  reasoning,
  rows,
  prevLabel,
  nextLabel,
  onPrev,
  onNext,
  onVerdictClick,
}: LichToPageCardProps) {
  const inlineReasoning = reasoning;
  return (
    <div
      style={{
        background: "#fff",
        color: CT.ink,
        position: "relative",
        boxShadow:
          "0 6px 16px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.03)",
        border: `1px solid ${CT.hairline2}`,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "12px 18px 6px" }}>
        <span
          style={{
            fontFamily: "var(--serif)",
            fontSize: 13.5,
            color: "var(--muted)",
          }}
        >
          {masthead}
        </span>
      </div>

      <div
        style={{
          padding: "4px 18px 12px",
          display: "flex",
          alignItems: "flex-end",
          gap: 14,
        }}
      >
        <div
          style={{
            fontFamily: "var(--display-2)",
            fontWeight: 800,
            fontSize: 124.5,
            color: CT.red,
            lineHeight: 0.84,
            letterSpacing: "-0.045em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {dayNumber}
        </div>
        <div style={{ paddingBottom: 14 }}>
          <div
            style={{
              fontFamily: "var(--display)",
              fontWeight: 900,
              fontSize: 30.5,
              color: CT.red,
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              lineHeight: 0.95,
            }}
          >
            {weekday}
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "0 18px 16px",
          fontFamily: "var(--serif)",
          fontSize: 13.5,
          color: CT.ink2,
          lineHeight: 1.55,
        }}
      >
        {lunarLine}
      </div>

      <div
        role={onVerdictClick ? "button" : undefined}
        tabIndex={onVerdictClick ? 0 : undefined}
        onClick={onVerdictClick}
        onKeyDown={
          onVerdictClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") onVerdictClick();
              }
            : undefined
        }
        style={{
          padding: "14px 18px 4px",
          borderTop: `1px solid ${CT.hairline}`,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          cursor: onVerdictClick ? "pointer" : undefined,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--display-2)",
              fontWeight: 700,
              fontSize: 17.5,
              color: CT.goldDeep,
              textTransform: "uppercase",
              letterSpacing: "-0.005em",
            }}
          >
            {verdictLabel}
          </div>
          {verdictSub ? (
            <div
              style={{
                fontFamily: "var(--serif)",
                fontSize: 12.5,
                color: "var(--muted)",
                marginTop: 2,
              }}
            >
              {verdictSub}
            </div>
          ) : null}
        </div>
        {score != null ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
            <span
              style={{
                fontFamily: "var(--display-2)",
                fontWeight: 800,
                fontSize: 38.5,
                color: CT.goldDeep,
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.015em",
              }}
            >
              {score}
            </span>
            <span
              style={{
                fontFamily: "var(--serif)",
                fontSize: 12.5,
                color: "var(--muted)",
              }}
            >
              /100
            </span>
          </div>
        ) : null}
      </div>

      {inlineReasoning}

      <div
        style={{
          padding: "12px 18px 14px",
          borderTop: `1px solid ${CT.hairline}`,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {rows.map((row) => (
          <div
            key={row.key}
            style={{
              display: "flex",
              gap: 14,
              alignItems: "baseline",
            }}
          >
            <Mono
              style={{
                color: row.color,
                fontSize: 9.5,
                width: 48,
                letterSpacing: "0.14em",
              }}
            >
              {row.key}
            </Mono>
            <div
              style={{
                flex: 1,
                fontFamily: "var(--serif)",
                fontSize: 13,
                color: CT.ink,
                lineHeight: 1.45,
              }}
            >
              {row.value}
            </div>
          </div>
        ))}
      </div>

      {(prevLabel || nextLabel) && (
        <div
          className="flex items-center justify-between gap-2"
          style={{
            padding: "12px 14px 14px",
            borderTop: `1px solid ${CT.hairline}`,
          }}
        >
          {prevLabel ? (
            <button
              type="button"
              onClick={onPrev}
              disabled={!onPrev}
              className="flex min-h-[44px] max-w-[48%] items-center border px-3 py-2 text-left disabled:opacity-45"
              style={{
                fontFamily: "var(--display-2)",
                fontSize: 12.5,
                fontWeight: 700,
                letterSpacing: "0.02em",
                color: onPrev ? CT.goldDeep : CT.muted,
                background: onPrev ? "rgba(154,124,34,0.12)" : "transparent",
                borderColor: onPrev ? "rgba(154,124,34,0.4)" : CT.hairline2,
                cursor: onPrev ? "pointer" : "default",
              }}
            >
              {prevLabel}
            </button>
          ) : (
            <span />
          )}
          {nextLabel ? (
            <button
              type="button"
              onClick={onNext}
              disabled={!onNext}
              className="flex min-h-[44px] max-w-[48%] items-center justify-end border px-3 py-2 text-right disabled:opacity-45"
              style={{
                fontFamily: "var(--display-2)",
                fontSize: 12.5,
                fontWeight: 700,
                letterSpacing: "0.02em",
                color: onNext ? CT.goldDeep : CT.muted,
                background: onNext ? "rgba(154,124,34,0.12)" : "transparent",
                borderColor: onNext ? "rgba(154,124,34,0.4)" : CT.hairline2,
                cursor: onNext ? "pointer" : "default",
              }}
            >
              {nextLabel}
            </button>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
