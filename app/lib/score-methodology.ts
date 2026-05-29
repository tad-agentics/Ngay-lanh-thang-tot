export type ScoreMethodologyWeightView = {
  factor: string;
  labelVi: string;
  maxPoints: number;
};

export type ScoreMethodologyView = {
  summaryVi: string;
  weights: ScoreMethodologyWeightView[];
};

function asRecord(x: unknown): Record<string, unknown> | null {
  if (x && typeof x === "object" && !Array.isArray(x)) {
    return x as Record<string, unknown>;
  }
  return null;
}

function pickStr(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/** Map tu-tru-api `score_methodology` → collapsible UI. */
export function parseScoreMethodology(raw: unknown): ScoreMethodologyView | null {
  const o = asRecord(raw);
  if (!o) return null;

  const summaryVi = pickStr(o, ["summary_vi", "summaryVi"]);
  const weights: ScoreMethodologyWeightView[] = [];
  const arr = o.weights;
  if (Array.isArray(arr)) {
    for (const item of arr) {
      const row = asRecord(item);
      if (!row) continue;
      const factor = pickStr(row, ["factor"]);
      const labelVi = pickStr(row, ["label_vi", "labelVi", "label"]);
      const maxRaw = row.max_points ?? row.maxPoints ?? row.points;
      const maxPoints =
        typeof maxRaw === "number" && Number.isFinite(maxRaw)
          ? Math.round(maxRaw)
          : typeof maxRaw === "string" && /^\d+$/.test(maxRaw.trim())
            ? Number.parseInt(maxRaw.trim(), 10)
            : 0;
      if (!labelVi && !factor) continue;
      weights.push({
        factor: factor || labelVi,
        labelVi: labelVi || factor,
        maxPoints,
      });
    }
  }

  if (!summaryVi && weights.length === 0) return null;
  return {
    summaryVi:
      summaryVi ||
      "Điểm tổng hợp từ Trực, sao, Can Chi với lá số, và giờ vàng.",
    weights,
  };
}
