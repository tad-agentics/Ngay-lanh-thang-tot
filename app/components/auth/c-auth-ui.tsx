import type { CSSProperties, ReactNode } from "react";

/** Direction C forest auth shell + form primitives (matches c-screens-c/d). */

export const C = {
  forest: "var(--forest-deep, #0e1c14)",
  cream: "var(--cream, #ede7d3)",
  gold: "var(--gold, #c5a55a)",
  goldDeep: "var(--gold-deep, #9a7c22)",
  ink: "var(--ink, #18150e)",
  ink2: "var(--ink-2, #3d3828)",
  muted: "var(--muted, #7a7050)",
  paperWarm: "var(--paper-warm, #ebe4d2)",
  red: "var(--red, #8b1a1a)",
  hairline: "var(--hairline, rgba(24,21,14,0.12))",
} as const;

export function forestGradientOverlay(
  opacity = 0.12,
  height = 280,
): CSSProperties {
  return {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height,
    background: `radial-gradient(ellipse at 50% 0%, rgba(197,165,90,${opacity}) 0%, transparent 70%)`,
    pointerEvents: "none",
  };
}

export const forestShell: CSSProperties = {
  minHeight: "100svh",
  background: C.forest,
  position: "relative",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  color: C.cream,
};

export const btnPrimaryGold: CSSProperties = {
  width: "100%",
  padding: 15,
  background: C.gold,
  color: C.forest,
  border: "none",
  fontFamily: "var(--display-2)",
  fontWeight: 800,
  fontSize: 13,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
};

export const btnOutlineCream: CSSProperties = {
  width: "100%",
  padding: 13,
  background: "transparent",
  color: C.cream,
  border: "1px solid rgba(237,231,211,0.25)",
  fontFamily: "var(--display-2)",
  fontWeight: 700,
  fontSize: 13,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
};

export const inputLabel: CSSProperties = {
  fontFamily: "var(--serif)",
  fontSize: 11.5,
  color: "rgba(237,231,211,0.55)",
};

export function inputUnderline(active = false): CSSProperties {
  return {
    width: "100%",
    marginTop: 4,
    padding: "6px 0",
    background: "transparent",
    border: "none",
    borderBottom: `1px solid ${active ? C.gold : "rgba(237,231,211,0.3)"}`,
    outline: "none",
    color: C.cream,
    fontFamily: "var(--display-2)",
    fontWeight: 600,
    fontSize: 17,
    letterSpacing: "-0.005em",
    borderRadius: 0,
    boxSizing: "border-box",
  };
}

export function CForestShell({
  children,
  gradientOpacity = 0.12,
  gradientHeight = 280,
  centered = false,
}: {
  children: ReactNode;
  gradientOpacity?: number;
  gradientHeight?: number;
  centered?: boolean;
}) {
  return (
    <main
      style={{
        ...forestShell,
        ...(centered
          ? { alignItems: "center", justifyContent: "center" }
          : {}),
      }}
    >
      <div style={forestGradientOverlay(gradientOpacity, gradientHeight)} />
      {children}
    </main>
  );
}

export function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#fff"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#fff"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0012 23z"
      />
      <path
        fill="#fff"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11 11 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#fff"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export const CANH_HOURS: readonly {
  name: string;
  range: string;
  code: number;
}[] = [
  { name: "Tý", range: "23–1h", code: 0 },
  { name: "Sửu", range: "1–3h", code: 2 },
  { name: "Dần", range: "3–5h", code: 4 },
  { name: "Mão", range: "5–7h", code: 6 },
  { name: "Thìn", range: "7–9h", code: 8 },
  { name: "Tỵ", range: "9–11h", code: 10 },
  { name: "Ngọ", range: "11–13h", code: 11 },
  { name: "Mùi", range: "13–15h", code: 14 },
  { name: "Thân", range: "15–17h", code: 16 },
  { name: "Dậu", range: "17–19h", code: 18 },
  { name: "Tuất", range: "19–21h", code: 20 },
  { name: "Hợi", range: "21–23h", code: 22 },
] as const;
