/**
 * BackBar — top-aligned chevron + title for ALL detail screens.
 * Mandatory anywhere BottomNav is hidden. Never hand-roll a back row.
 *
 * Light variant: paper background, ink text.
 * Dark variant: forest background, cream text.
 */

import { type ReactNode } from "react";
import { useNavigate } from "react-router";

interface BackBarProps {
  title?: string;
  subtitle?: string;
  /** Override the back action. Defaults to navigate(-1). */
  onBack?: () => void;
  /** Shows an X close button on the right side. */
  onClose?: () => void;
  /** Use forest-dark styling (ceremonial screens). */
  dark?: boolean;
  /** Accent color override. */
  accent?: string;
  /** Right-side slot — e.g. CreditsHeaderChip. */
  endAdornment?: ReactNode;
}

export function BackBar({
  title,
  subtitle,
  onBack,
  onClose,
  dark = false,
  accent,
  endAdornment,
}: BackBarProps) {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => void navigate(-1));

  const fg = dark ? "var(--cream, #ede7d3)" : "var(--ink, #1a1a1a)";
  const muteFg = dark ? "rgba(200,188,152,0.65)" : "#7a7050";
  const ac = accent ?? (dark ? "var(--gold, #c5a55a)" : "var(--gold-deep, #7d6219)");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 16px 12px",
        position: "relative",
        zIndex: 5,
      }}
    >
      <button
        type="button"
        onClick={handleBack}
        aria-label="Quay lại"
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: dark
            ? "rgba(237,231,211,0.06)"
            : "rgba(24,21,14,0.04)",
          border: `1px solid ${dark ? "rgba(197,165,90,0.25)" : "rgba(154,124,34,0.2)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: ac,
          cursor: "pointer",
          flexShrink: 0,
          padding: 0,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <div style={{ flex: 1, minWidth: 0, lineHeight: 1.1 }}>
        {subtitle && (
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 12,
              color: muteFg,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            {subtitle}
          </div>
        )}
        {title && (
          <div
            style={{
              fontFamily: "var(--display-2)",
              fontWeight: 800,
              fontSize: 14,
              color: fg,
              textTransform: "uppercase",
              letterSpacing: "-0.005em",
              marginTop: subtitle ? 2 : 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </div>
        )}
      </div>

      {endAdornment && (
        <div style={{ flexShrink: 0 }}>{endAdornment}</div>
      )}

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "transparent",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: muteFg,
            cursor: "pointer",
            flexShrink: 0,
            padding: 0,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
