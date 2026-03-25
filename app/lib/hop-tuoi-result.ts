function asRecord(x: unknown): Record<string, unknown> | null {
  if (x && typeof x === "object" && !Array.isArray(x)) {
    return x as Record<string, unknown>;
  }
  return null;
}

export type HopTuoiGradLabel =
  | "Rất hợp"
  | "Hợp"
  | "Trung bình"
  | "Cần lưu ý";

/** Top two bands align with app-wide letter grades (A/B at 85 / 70). */
export function scoreToGradLabel(score: number): HopTuoiGradLabel {
  if (score >= 85) return "Rất hợp";
  if (score >= 70) return "Hợp";
  if (score >= 40) return "Trung bình";
  return "Cần lưu ý";
}

function pickNumber(obj: Record<string, unknown>, keys: string[]): number {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) {
      return Math.max(0, Math.min(100, Math.round(v)));
    }
    if (typeof v === "string" && v.trim()) {
      const n = Number.parseFloat(v.replace(",", "."));
      if (Number.isFinite(n)) {
        return Math.max(0, Math.min(100, Math.round(n)));
      }
    }
  }
  return 72;
}

function pickStr(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "—";
}

/**
 * Map tu-tru-api POST /v1/hop-tuoi JSON (schema-less in OpenAPI) → HopTuoiResultPanel props.
 */
function gradLabelFromLetterGrade(
  nested: Record<string, unknown>,
  score: number,
): HopTuoiGradLabel {
  const g = pickStr(nested, ["grade", "letter_grade", "rank", "xep_hang"])
    .toUpperCase()
    .slice(0, 1);
  if (g === "A") return "Rất hợp";
  if (g === "B") return "Hợp";
  if (g === "C") return "Trung bình";
  if (g === "D" || g === "E" || g === "F") return "Cần lưu ý";
  return scoreToGradLabel(score);
}

export function hopTuoiPayloadToPanel(data: unknown): {
  score: number;
  gradLabel: HopTuoiGradLabel;
  naphAm1: string;
  naphAm2: string;
  naphAmRelation: string;
} | null {
  const root = asRecord(data);
  if (!root) return null;

  const nested =
    asRecord(root.data) ??
    asRecord(root.result) ??
    asRecord(root.hop_tuoi) ??
    root;

  const score = pickNumber(nested, [
    "overall_score",
    "score",
    "diem",
    "hop_diem",
    "compatibility_score",
  ]);

  const gradRaw = pickStr(nested, ["grad", "grade_label", "muc_do", "level"]);
  let gradLabel: HopTuoiGradLabel =
    gradRaw === "Rất hợp" ||
    gradRaw === "Hợp" ||
    gradRaw === "Trung bình" ||
    gradRaw === "Cần lưu ý"
      ? gradRaw
      : gradLabelFromLetterGrade(nested, score);

  const p1 = asRecord(nested.person1);
  const p2 = asRecord(nested.person2);

  let naphAm1 = pickStr(nested, [
    "nap_am_1",
    "naph_am_1",
    "napAm1",
    "na1",
    "na_pham_1",
  ]);
  if (naphAm1 === "—" && p1) {
    naphAm1 = pickStr(p1, ["menh", "nap_am_name", "nap_am", "name"]);
  }

  let naphAm2 = pickStr(nested, [
    "nap_am_2",
    "naph_am_2",
    "napAm2",
    "na2",
    "na_pham_2",
  ]);
  if (naphAm2 === "—" && p2) {
    naphAm2 = pickStr(p2, ["menh", "nap_am_name", "nap_am", "name"]);
  }

  let naphAmRelation = pickStr(nested, [
    "summary",
    "nap_am_relation",
    "naph_am_relation",
    "ngu_hanh_relation",
    "mo_ta",
    "message",
    "tom_tat",
  ]);

  const nguHanH = pickStr(nested, ["ngu_hanh_relation", "nguHanhRelation"]);
  if (naphAmRelation === "—" && nguHanH !== "—") {
    naphAmRelation = nguHanH;
  }

  if (naphAmRelation === "—" && (naphAm1 !== "—" || naphAm2 !== "—")) {
    naphAmRelation = "Hai Nạp Âm tương tác — xem chi tiết trong lá số từng người.";
  }

  return {
    score,
    gradLabel,
    naphAm1,
    naphAm2,
    naphAmRelation,
  };
}
