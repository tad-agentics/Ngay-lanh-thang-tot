/**
 * Direction B maket — typography, color, spacing from Figma HTML export
 * (`--paper`, Montserrat display, IBM Plex Mono labels, etc.).
 */

export const HM = {
  paper: "#f1ece1",
  /** Wide-viewport gutter behind the app column (export `--bg`). */
  gutter: "#e4dfd6",
  ink: "#18150e",
  gold: "#c5a55a",
  goldDeep: "#9a7c22",
  cream: "#ede7d3",
  forest: "#1d3129",
  forestDeep: "#15241e",
  muted: "#7a7050",
  body: "#3a3220",
  bodyMuted: "#5a4f30",
  red: "#8b1a1a",
  accentWarm: "#e58a5c",
  borderSection: "rgba(154, 124, 34, 0.2)",
  borderCard: "rgba(154, 124, 34, 0.18)",
  borderChip: "rgba(197, 165, 90, 0.35)",
  chipBg: "rgba(197, 165, 90, 0.18)",
  borderHourGood: "rgba(154, 124, 34, 0.2)",
  borderHourBad: "rgba(139, 26, 26, 0.3)",
  pxPage: 22,
  radM: 10,
  frame: 390,
  inner: 346,
  display: "var(--font-montserrat)",
  serif: "var(--serif)",
  mono: "var(--mono)",
} as const;

export type MaketTokens = typeof HM;
