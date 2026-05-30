/**
 * Ticket / Phiếu — the primary card primitive. Replaces any rounded-card + left-border pattern.
 * Perforation edge rendered at top and bottom. Punch holes on both sides near the top perforation.
 *
 * variant: "classic" | "wave" | "sharp" (perforation style)
 */

import { type CSSProperties, type ReactNode } from "react";
import { Mono } from "./Mono";

type Perf = "classic" | "wave" | "sharp" | "none";

function PerfEdge({ side, variant }: { side: "top" | "bottom"; variant: Perf }) {
  if (variant === "none") return null;
  const dashed =
    side === "top"
      ? { borderBottom: "1px dashed rgba(122,112,80,0.45)" }
      : { borderTop: "1px dashed rgba(122,112,80,0.45)" };
  if (variant === "wave") {
    return (
      <svg
        viewBox="0 0 400 12"
        preserveAspectRatio="none"
        style={{ display: "block", width: "100%", height: 12 }}
      >
        <path
          d="M0,6 Q10,0 20,6 T40,6 T60,6 T80,6 T100,6 T120,6 T140,6 T160,6 T180,6 T200,6 T220,6 T240,6 T260,6 T280,6 T300,6 T320,6 T340,6 T360,6 T380,6 T400,6"
          stroke="rgba(122,112,80,0.45)"
          strokeWidth="1"
          fill="none"
          strokeDasharray="3 3"
        />
      </svg>
    );
  }
  if (variant === "sharp") {
    return (
      <svg
        viewBox="0 0 400 12"
        preserveAspectRatio="none"
        style={{ display: "block", width: "100%", height: 12 }}
      >
        <path
          d="M0,12 L10,2 L20,12 L30,2 L40,12 L50,2 L60,12 L70,2 L80,12 L90,2 L100,12 L110,2 L120,12 L130,2 L140,12 L150,2 L160,12 L170,2 L180,12 L190,2 L200,12 L210,2 L220,12 L230,2 L240,12 L250,2 L260,12 L270,2 L280,12 L290,2 L300,12 L310,2 L320,12 L330,2 L340,12 L350,2 L360,12 L370,2 L380,12 L390,2 L400,12"
          stroke="rgba(122,112,80,0.55)"
          strokeWidth="0.8"
          fill="none"
        />
      </svg>
    );
  }
  // classic: dashed line
  return (
    <div
      style={{
        height: 12,
        background:
          "repeating-linear-gradient(90deg, transparent 0 6px, rgba(122,112,80,0.06) 6px 10px)",
        ...dashed,
      }}
    />
  );
}

export function Ticket({
  children,
  variant = "classic",
  holes = true,
  holeColor = "#1d3129",
  stub = false,
  stubLabel,
  transform,
  style,
}: {
  children: ReactNode;
  variant?: Perf;
  holes?: boolean;
  holeColor?: string;
  stub?: boolean;
  stubLabel?: string;
  transform?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        background: "var(--paper-warm, #ebe4d2)",
        position: "relative",
        boxShadow:
          "0 18px 36px rgba(0,0,0,0.45), 0 4px 8px rgba(0,0,0,0.25)",
        transform,
        ...style,
      }}
    >
      <PerfEdge side="top" variant={variant} />
      {holes && (
        <>
          <div
            style={{
              position: "absolute",
              top: 38,
              left: -7,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: holeColor,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 38,
              right: -7,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: holeColor,
            }}
          />
        </>
      )}
      <div style={{ padding: 0 }}>{children}</div>
      {stub && (
        <>
          <PerfEdge side="bottom" variant={variant} />
          <div
            style={{
              padding: "10px 18px",
              background: "rgba(122,112,80,0.06)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Mono style={{ color: "#7a7050" }}>
              {stubLabel ?? "Phiếu lưu — đối chiếu"}
            </Mono>
            <span
              style={{
                fontFamily: "var(--mono)",
                fontWeight: 600,
                fontSize: 12.5,
                color: "#9a7c22",
                letterSpacing: "0.18em",
              }}
            >
              ·NLTT·2026·
            </span>
          </div>
        </>
      )}
      <PerfEdge side="bottom" variant={variant} />
    </div>
  );
}
