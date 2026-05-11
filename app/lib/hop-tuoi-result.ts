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

export type HopTuoiCriteriaSentiment =
  | "positive"
  | "neutral"
  | "negative"
  | "unknown";

export interface HopTuoiCriterionRow {
  name: string;
  sentiment: HopTuoiCriteriaSentiment;
  description: string | null;
}

export interface HopTuoiPersonCard {
  menh: string;
  hanh: string | null;
  nhatChu: string | null;
  genderLabel: string | null;
  birthDate: string | null;
}

/** Giá trị `relationship_type` — POST /v1/hop-tuoi → phản hồi v2. */
export const HOP_TUOI_RELATIONSHIP_OPTIONS: {
  value: string;
  label: string;
}[] = [
  { value: "", label: "Chọn mối quan hệ" },
  { value: "PHU_THE", label: "Phu thê / vợ chồng" },
  { value: "DOI_TAC", label: "Đối tác" },
  { value: "SEP_NHAN_VIEN", label: "Sếp — nhân viên" },
  { value: "DONG_NGHIEP", label: "Đồng nghiệp" },
  { value: "BAN_BE", label: "Bạn bè" },
  { value: "PHU_TU", label: "Phụ — tử" },
  { value: "ANH_CHI_EM", label: "Anh chị em" },
  { value: "THAY_TRO", label: "Thầy — trò" },
];

export function relationshipLabelFromType(type: string | null): string | null {
  if (!type || !type.trim()) return null;
  const opt = HOP_TUOI_RELATIONSHIP_OPTIONS.find((o) => o.value === type.trim());
  return opt?.label ?? type.trim();
}

export function hopTuoiGradToLetterGrade(
  grad: HopTuoiGradLabel,
): "A" | "B" | "C" {
  if (grad === "Rất hợp") return "A";
  if (grad === "Hợp") return "B";
  return "C";
}

/** Top two bands align with app-wide letter grades (A/B at 85 / 70). */
export function scoreToGradLabel(score: number): HopTuoiGradLabel {
  if (score >= 85) return "Rất hợp";
  if (score >= 70) return "Hợp";
  if (score >= 40) return "Trung bình";
  return "Cần lưu ý";
}

function pickNumberOptional(
  obj: Record<string, unknown>,
  keys: string[],
): number | null {
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
  return null;
}

function pickStr(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "—";
}

function pickStrOrNull(
  obj: Record<string, unknown>,
  keys: string[],
): string | null {
  const s = pickStr(obj, keys);
  return s === "—" ? null : s;
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
  if (pickCriteriaRows(nested).length > 0) return 2;
  return 1;
}

function verdictLevelToGrad(level: number): HopTuoiGradLabel {
  if (level >= 4) return "Rất hợp";
  if (level === 3) return "Hợp";
  if (level === 2) return "Trung bình";
  return "Cần lưu ý";
}

function parseVerdictLevel(nested: Record<string, unknown>): number | null {
  const raw = nested.verdict_level ?? nested.verdictLevel;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const n = Math.round(raw);
    if (n >= 1 && n <= 4) return n;
    return null;
  }
  if (typeof raw === "string" && /^\d+$/.test(raw.trim())) {
    const n = Number.parseInt(raw.trim(), 10);
    if (n >= 1 && n <= 4) return n;
  }
  return null;
}

function normalizeSentiment(raw: unknown): HopTuoiCriteriaSentiment {
  if (raw == null) return "unknown";
  const s = String(raw).trim().toLowerCase();
  if (!s) return "unknown";
  // Tránh "không tốt" / "không ổn" khớp nhánh "tốt" → positive.
  if (
    s.includes("không") &&
    (s.includes("tốt") || s.includes("tot") || s.includes("ổn"))
  ) {
    return "negative";
  }
  if (
    s === "negative" ||
    s === "neg" ||
    s.includes("negative") ||
    s.includes("tiêu cực") ||
    s.includes("tieu cuc") ||
    s.includes("rủi ro") ||
    s.includes("rui ro") ||
    s.includes("cảnh báo") ||
    s.includes("canh bao")
  ) {
    return "negative";
  }
  if (
    s === "positive" ||
    s === "pos" ||
    s.includes("positive") ||
    s.includes("tích cực") ||
    s.includes("tich cuc") ||
    s.includes("tot") ||
    s.includes("tốt")
  ) {
    return "positive";
  }
  if (
    s === "neutral" ||
    s.includes("neutral") ||
    s.includes("trung tính") ||
    s.includes("trung tinh") ||
    s.includes("trung lập") ||
    s.includes("trung lap")
  ) {
    return "neutral";
  }
  return "unknown";
}

function criterionDescriptionFromObject(
  o: Record<string, unknown>,
): string | null {
  const d = pickStr(o, [
    "description",
    "detail",
    "mo_ta",
    "reading",
    "text",
    "body",
  ]);
  return d === "—" ? null : d;
}

function pickCriteriaRows(nested: Record<string, unknown>): HopTuoiCriterionRow[] {
  const raw = nested.criteria ?? nested.tieu_chi ?? nested.tieuchi;
  if (!Array.isArray(raw)) {
    if (typeof raw === "string" && raw.trim()) {
      return raw
        .split(/\n+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name) => ({
          name,
          sentiment: "unknown" as const,
          description: null,
        }));
    }
    return [];
  }
  const rows: HopTuoiCriterionRow[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const name = item.trim();
      if (name) {
        rows.push({ name, sentiment: "unknown", description: null });
      }
      continue;
    }
    const o = asRecord(item);
    if (!o) continue;
    const name = pickStr(o, [
      "name",
      "label",
      "title",
      "key",
      "text",
      "criterion",
    ]);
    if (name === "—") continue;
    const description = criterionDescriptionFromObject(o);
    const sentiment = normalizeSentiment(
      o.sentiment ?? o.tone ?? o.polarity ?? o.valence,
    );
    rows.push({ name, sentiment, description });
  }
  const order: Record<HopTuoiCriteriaSentiment, number> = {
    negative: 0,
    unknown: 1,
    neutral: 2,
    positive: 3,
  };
  rows.sort((a, b) => order[a.sentiment] - order[b.sentiment]);
  return rows;
}

function verdictToGradLabel(verdict: string, score: number): HopTuoiGradLabel {
  const n = verdict.normalize("NFC");
  const lower = n.toLowerCase();
  const u = n.toUpperCase();
  if (lower.includes("không") && lower.includes("hợp")) {
    return "Cần lưu ý";
  }
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

function personToCard(
  p: Record<string, unknown> | null | undefined,
): HopTuoiPersonCard | null {
  if (!p) return null;
  const menh = pickStr(p, ["menh", "nap_am_name", "nap_am", "name"]);
  const hanh = pickStrOrNull(p, ["hanh", "ngu_hanh", "han"]);
  const nhatChu = pickStrOrNull(p, ["nhatChu", "nhat_chu", "nhatChuHan"]);
  const birthDate = pickStrOrNull(p, ["birth_date", "birthDate"]);
  const g = p.gender;
  let genderLabel: string | null = null;
  if (g === 1 || g === "1") genderLabel = "Nam";
  else if (g === -1 || g === "-1") genderLabel = "Nữ";
  return {
    menh: menh === "—" ? "—" : menh,
    hanh,
    nhatChu,
    genderLabel,
    birthDate,
  };
}

export interface HopTuoiPanelView {
  apiVersion: 1 | 2;
  /** null khi v2 không gửi điểm — không hiển thị /100. */
  score: number | null;
  gradLabel: HopTuoiGradLabel;
  chipLabel: string;
  naphAm1: string;
  naphAm2: string;
  naphAmRelation: string;
  verdict: string | null;
  verdictLevel: number | null;
  /** Giữ tên tiêu chí cho tương thích / test. */
  criteriaLines: string[];
  criteriaRows: HopTuoiCriterionRow[];
  reading: string | null;
  advice: string | null;
  relationshipType: string | null;
  relationshipLabel: string | null;
  personCards: { p1: HopTuoiPersonCard | null; p2: HopTuoiPersonCard | null };
  /** Hiện vòng điểm 0–100 chỉ khi có số từ API (v1 hoặc v2 có score). */
  showNumericScore: boolean;
}

/**
 * Map tu-tru-api POST /v1/hop-tuoi JSON → `HopTuoiPanelView`.
 * v1: không gửi `relationship_type` (điểm + grade).
 * v2: `relationship_type` → `version: 2`, định tính (verdict, criteria, reading, advice).
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
  const scoreKeys = [
    "overall_score",
    "score",
    "diem",
    "hop_diem",
    "compatibility_score",
  ];
  const explicitScore = pickNumberOptional(nested, scoreKeys);
  const scoreV1 = explicitScore ?? 72;
  const scoreForV2 = explicitScore;
  const verdictLevel = parseVerdictLevel(nested);

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

  const criteriaRows =
    apiVersion === 2 ? pickCriteriaRows(nested) : [];
  const criteriaLines = criteriaRows.map((r) => r.name);

  const relationshipTypeRaw = pickStr(nested, [
    "relationship_type",
    "relationshipType",
    "loai_quan_he",
  ]);
  const relationshipType =
    relationshipTypeRaw !== "—" ? relationshipTypeRaw : null;

  const relationshipLabelRaw = pickStr(nested, [
    "relationship_label",
    "relationshipLabel",
  ]);
  const relationshipLabel =
    relationshipLabelRaw !== "—"
      ? relationshipLabelRaw
      : relationshipLabelFromType(relationshipType);

  const personCards = {
    p1: personToCard(p1 ?? undefined),
    p2: personToCard(p2 ?? undefined),
  };

  if (apiVersion === 2) {
    const toneScore =
      scoreForV2 ?? (verdictLevel != null ? verdictLevel * 25 : 50);
    let gradLabel: HopTuoiGradLabel;
    if (verdict) {
      gradLabel = verdictToGradLabel(verdict, toneScore);
    } else if (verdictLevel != null) {
      gradLabel = verdictLevelToGrad(verdictLevel);
    } else {
      gradLabel = gradLabelFromLetterGrade(nested, toneScore);
    }
    const chipLabel = verdict ?? gradLabel;

    if (
      naphAmRelation !== "—" &&
      reading &&
      naphAmRelation.trim() === reading.trim()
    ) {
      naphAmRelation =
        "Tóm tắt Nạp Âm — nội dung chi tiết xem ở Luận giải / Tiêu chí.";
    }
    if (naphAmRelation === "—" && (naphAm1 !== "—" || naphAm2 !== "—")) {
      naphAmRelation =
        "Hai Nạp Âm được đối chiếu trong tiêu chí và luận giải phía trên.";
    }

    const showNumericScore = scoreForV2 != null;

    return {
      apiVersion: 2,
      score: scoreForV2,
      gradLabel,
      chipLabel,
      naphAm1,
      naphAm2,
      naphAmRelation,
      verdict,
      verdictLevel,
      criteriaLines,
      criteriaRows,
      reading,
      advice,
      relationshipType,
      relationshipLabel,
      personCards,
      showNumericScore,
    };
  }

  const score = scoreV1;
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
    verdictLevel: null,
    criteriaLines: [],
    criteriaRows: [],
    reading: null,
    advice: null,
    relationshipType: null,
    relationshipLabel: null,
    personCards,
    showNumericScore: true,
  };
}
