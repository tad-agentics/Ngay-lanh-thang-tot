/**
 * BackBar — top chevron + title for detail screens (Direction C `CBackBar` in c-screens-c.jsx).
 * Mandatory anywhere BottomNav is hidden.
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
  /** Right-side slot — e.g. actions or badges. */
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

  const fg = dark ? "var(--cream, #ede7d3)" : "var(--ink, #18150e)";
  const muteFg = dark ? "rgba(200,188,152,0.6)" : "var(--muted-warm, #7a7050)";
  const ac = accent ?? (dark ? "var(--gold, #c5a55a)" : "var(--gold-deep, #9a7c22)");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 22px 12px",
        position: "relative",
        zIndex: 5,
      }}
    >
      <button
        type="button"
        onClick={handleBack}
        aria-label="Quay lại"
        style={{
          minWidth: 44,
          minHeight: 44,
          margin: "-8px 0",
          padding: "0 4px 0 0",
          background: "transparent",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: ac,
          cursor: "pointer",
          flexShrink: 0,
          fontFamily: "var(--serif)",
          fontSize: 20,
          lineHeight: 1,
        }}
      >
        ‹
      </button>

      <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
        {subtitle ? (
          <div
            style={{
              fontFamily: "var(--serif)",
              fontSize: 11,
              color: muteFg,
              marginBottom: 2,
            }}
          >
            {subtitle}
          </div>
        ) : null}
        {title ? (
          <div
            style={{
              fontFamily: "var(--serif)",
              fontSize: 13,
              color: fg,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </div>
        ) : null}
      </div>

      {endAdornment ? (
        <div style={{ flexShrink: 0 }}>{endAdornment}</div>
      ) : null}

      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          style={{
            minWidth: 44,
            minHeight: 44,
            margin: "-8px 0",
            background: "transparent",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: muteFg,
            cursor: "pointer",
            flexShrink: 0,
            padding: 0,
            fontFamily: "var(--serif)",
            fontSize: 22,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
