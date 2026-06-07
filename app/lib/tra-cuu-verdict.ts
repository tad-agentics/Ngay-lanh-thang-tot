import { CT } from "~/lib/c-tokens";

export type TraCuuVerdictKind = "nen" | "cannhac" | "khong";

export type TraCuuVerdictStyle = {
  kind: TraCuuVerdictKind;
  label: string;
  color: string;
  tint: string;
  edge: string;
};

/** Tra cứu day screen verdict — Nên / Cân nhắc / Không nên (prototype `V`). */
export function traCuuDayVerdictFromScore(score: number): TraCuuVerdictStyle {
  if (score >= 70) {
    return {
      kind: "nen",
      label: "Nên",
      color: CT.forest,
      tint: "rgba(29,49,41,0.06)",
      edge: CT.forest,
    };
  }
  if (score >= 55) {
    return {
      kind: "cannhac",
      label: "Cân nhắc",
      color: CT.goldDeep,
      tint: "rgba(154,124,34,0.08)",
      edge: CT.goldDeep,
    };
  }
  return {
    kind: "khong",
    label: "Không nên",
    color: CT.red,
    tint: "rgba(163,32,31,0.05)",
    edge: CT.red,
  };
}

/** @deprecated Use traCuuDayVerdictFromScore */
export function traCuuDayVerdictLabel(score: number): string {
  return traCuuDayVerdictFromScore(score).label;
}
