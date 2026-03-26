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

/** Giá trị `relationship_type` — POST /v1/hop-tuoi → phản hồi v2. */
export const HOP_TUOI_RELATIONSHIP_OPTIONS: {
  value: string;
  label: string;
}[] = [
  { value: "", label: "Chưa rõ mối quan hệ" },
  { value: "PHU_THE", label: "Phu thê / vợ chồng" },
  { value: "DOI_TAC", label: "Đối tác" },
  { value: "SEP_NHAN_VIEN", label: "Sếp — nhân viên" },
  { value: "DONG_NGHIEP", label: "Đồng nghiệp" },
  { value: "BAN_BE", label: "Bạn bè" },
  { value: "PHU_TU", label: "Phụ — tử" },
  { value: "ANH_CHI_EM", label: "Anh chị em" },
  { value: "THAY_TRO", label: "Thầy — trò" },
];

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

function parseApiVersion(nested: Record<string, unknown>): 1 | 2 {
  const v = nested.version ?? nested.api_version ?? nested.apiVersion;
  if (v === 2 || v === "2") return 2;
  if (v === 1 || v === "1") return 1;
  const verdict = pickStr(nested, ["verdict", "ket_luan", "ketLuan"]);
  if (verdict === "—") return 1;
  const reading = pickStr(nested, [
    "reading",
    "reading_vi",
    "doc",
    "dien_giai",
  ]);
  if (reading !== "—") return 2;
  const advice = pickStr(nested, ["advice", "loi_khuyen", "loiKhuyen"]);
  if (advice !== "—") return 2;
  if (pickCriteriaLines(nested).length > 0) return 2;
  return 1;
}

function verdictToGradLabel(verdict: string, score: number): HopTuoiGradLabel {
  const n = verdict.normalize("NFC");
  const lower = n.toLowerCase();
  const u = n.toUpperCase();
  if (lower.includes("không") && lower.includes("hợp")) {
    return "Cần lưu ý";
  }
  // Cảnh báo trước từ khẳng định mạnh ("rất", VERY) — vd. "Rất cần lưu ý" không được thành "Rất hợp".
  if (
    lower.includes("lưu ý") ||
    lower.includes("rủi ro") ||
    lower.includes("cẩn trọng")
  ) {
    return "Cần lưu ý";
  }
  if (
    u.includes("RAT") ||
    lower.includes("rất") ||
    lower.includes("rất hợp") ||
    u.includes("VERY")
  ) {
    return "Rất hợp";
  }
  if (lower.includes("trung bình") || lower.includes("trung tính")) {
    return "Trung bình";
  }
  if (lower.includes("hợp") || u.includes("GOOD")) {
    return "Hợp";
  }
  if (u.includes("TRUNG")) {
    return "Trung bình";
  }
  return scoreToGradLabel(score);
}

function pickCriteriaLines(nested: Record<string, unknown>): string[] {
  const raw = nested.criteria ?? nested.tieu_chi ?? nested.tieuchi;
  if (Array.isArray(raw)) {
    const out: string[] = [];
    for (const item of raw) {
      if (typeof item === "string" && item.trim()) {
        out.push(item.trim());
        continue;
      }
      const o = asRecord(item);
      if (o) {
        const line = pickStr(o, [
          "label",
          "title",
          "name",
          "text",
          "description",
          "detail",
          "reading",
        ]);
        if (line !== "—") out.push(line);
      }
    }
    return out;
  }
  if (typeof raw === "string" && raw.trim()) {
    return raw
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

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

export interface HopTuoiPanelView {
  apiVersion: 1 | 2;
  score: number;
  gradLabel: HopTuoiGradLabel;
  /** Nhãn chip: v2 dùng `verdict` từ API khi có */
  chipLabel: string;
  naphAm1: string;
  naphAm2: string;
  naphAmRelation: string;
  verdict: string | null;
  criteriaLines: string[];
  reading: string | null;
  advice: string | null;
  relationshipType: string | null;
}

/**
 * Map tu-tru-api POST /v1/hop-tuoi JSON → `HopTuoiPanelView`.
 * v1: không gửi `relationship_type` (điểm + grade).
 * v2: có `relationship_type` → `version: 2`, `verdict`, `criteria`, `reading`, `advice`.
 */
export function hopTuoiPayloadToPanel(data: unknown): HopTuoiPanelView | null {
  const root = asRecord(data);
  if (!root) return null;

  const nested =
    asRecord(root.data) ??
    asRecord(root.result) ??
    asRecord(root.hop_tuoi) ??
    root;

  const apiVersion = parseApiVersion(nested);

  const score = pickNumber(nested, [
    "overall_score",
    "score",
    "diem",
    "hop_diem",
    "compatibility_score",
  ]);

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

  const verdictRaw = pickStr(nested, ["verdict", "ket_luan", "ketLuan"]);
  const verdict = verdictRaw !== "—" ? verdictRaw : null;

  const readingRaw = pickStr(nested, [
    "reading",
    "reading_vi",
    "doc",
    "dien_giai",
    "diễn giải",
  ]);
  const reading = readingRaw !== "—" ? readingRaw : null;

  const adviceRaw = pickStr(nested, [
    "advice",
    "loi_khuyen",
    "loiKhuyen",
    "khuyen",
  ]);
  const advice = adviceRaw !== "—" ? adviceRaw : null;

  const criteriaLines = apiVersion === 2 ? pickCriteriaLines(nested) : [];

  const relationshipTypeRaw = pickStr(nested, [
    "relationship_type",
    "relationshipType",
    "loai_quan_he",
  ]);
  const relationshipType =
    relationshipTypeRaw !== "—" ? relationshipTypeRaw : null;

  if (apiVersion === 2) {
    const gradLabel = verdict
      ? verdictToGradLabel(verdict, score)
      : gradLabelFromLetterGrade(nested, score);
    const chipLabel = verdict ?? gradLabel;
    if (naphAmRelation === "—" && reading) {
      naphAmRelation = reading;
    } else if (naphAmRelation === "—" && (naphAm1 !== "—" || naphAm2 !== "—")) {
      naphAmRelation =
        "Quan hệ theo Bát Tự — xem diễn giải và tiêu chí bên dưới.";
    }
    return {
      apiVersion: 2,
      score,
      gradLabel,
      chipLabel,
      naphAm1,
      naphAm2,
      naphAmRelation,
      verdict,
      criteriaLines,
      reading,
      advice,
      relationshipType,
    };
  }

  const gradRaw = pickStr(nested, ["grad", "grade_label", "muc_do", "level"]);
  let gradLabel: HopTuoiGradLabel =
    gradRaw === "Rất hợp" ||
    gradRaw === "Hợp" ||
    gradRaw === "Trung bình" ||
    gradRaw === "Cần lưu ý"
      ? gradRaw
      : gradLabelFromLetterGrade(nested, score);

  if (naphAmRelation === "—" && (naphAm1 !== "—" || naphAm2 !== "—")) {
    naphAmRelation = "Hai Nạp Âm tương tác — xem chi tiết trong lá số từng người.";
  }

  return {
    apiVersion: 1,
    score,
    gradLabel,
    chipLabel: gradLabel,
    naphAm1,
    naphAm2,
    naphAmRelation,
    verdict: null,
    criteriaLines: [],
    reading: null,
    advice: null,
    relationshipType: null,
  };
}
