import { extractDetailReasonLines } from "~/lib/chon-ngay-detail";
import { formatHourRangeForDisplayVi } from "~/lib/format-gio-tot-display-vi";
import { TU_TRU_INTENT_OPTIONS } from "~/lib/tu-tru-intents";

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

function firstNonEmptySlotArray(
  obj: Record<string, unknown>,
  keys: string[],
): unknown[] | null {
  for (const k of keys) {
    const v = obj[k];
    if (Array.isArray(v) && v.length > 0) return v;
  }
  return null;
}

/** Giờ Hoàng/Hắc đạo — cùng cách đọc như thẻ Hôm nay (vd. `23–1 giờ đêm · 7–9 giờ sáng`). */
function formatGioSlotsHumanVi(
  nested: Record<string, unknown>,
  keys: string[],
): string {
  const arr = firstNonEmptySlotArray(nested, keys);
  if (!arr) return "—";
  const s = formatHourRangeForDisplayVi("", arr);
  return s === "—" ? "—" : s;
}

function labelsFromMixedArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const x of raw) {
    if (typeof x === "string" && x.trim()) out.push(x.trim());
    else {
      const o = asRecord(x);
      if (o) {
        const n = pickStr(o, ["name", "label", "title"]);
        if (n) out.push(n);
      }
    }
  }
  return out;
}

function dedupeLabels(labels: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const l of labels) {
    const k = l.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(l);
  }
  return out;
}

export interface DayDetailBreakdownRow {
  source: string;
  points: number;
  reasonVi: string;
  type: string;
}

export type DayDetailPurposeVerdict = "nen_lam" | "khong_nen" | "trung_lap";

export interface DayDetailPurposeRow {
  label: string;
  verdict: DayDetailPurposeVerdict;
}

export interface DayDetailViewModel {
  lunarDate: string;
  canChi: string;
  trucLine: string;
  starLine: string;
  /** Tiêu đề thẻ Trực (vd. `Trực Thành`). */
  trucTitle: string;
  /** Mô tả ngắn dưới tên trực. */
  trucDescription: string;
  score: number | null;
  grade: string;
  reasonLines: string[];
  goodFor: string[];
  avoidFor: string[];
  gioTot: string;
  gioXau: string;
  /** Cát thần / sao tốt (nếu API có). */
  catThanLabels: string[];
  /** Hung sát (nếu API có). */
  hungSatLabels: string[];
  /**
   * Gợi ý theo mục đích — `good_for` / `avoid_for` + API (không hiển thị điểm từng mục).
   */
  purposeRows: DayDetailPurposeRow[];
  breakdown: DayDetailBreakdownRow[];
}

function pickNumber(obj: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v.trim())) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function stringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function verdictFromApiObject(
  o: Record<string, unknown>,
  label: string,
  goodLc: Set<string>,
  avoidLc: Set<string>,
): DayDetailPurposeVerdict {
  const explicit = pickStr(o, ["verdict", "recommendation", "suitability", "ket_luan"]);
  if (explicit) {
    const e = explicit.toLowerCase();
    if (/không nên|tránh|hạn chế|kém|xấu|ngày dữ|bad|avoid|no\b/.test(e)) {
      return "khong_nen";
    }
    if (/nên|ngày lành|tốt|phù hợp|good|ok|recommended|yes/.test(e)) {
      return "nen_lam";
    }
  }
  if (o.suitable === false || o.ok === false || o.should_do === false) {
    return "khong_nen";
  }
  if (o.suitable === true || o.ok === true || o.should_do === true) {
    return "nen_lam";
  }
  let pts = pickNumber(o, ["score", "points", "diem", "value"]);
  if (pts == null) pts = pickNumber(asRecord(o.scores) ?? {}, ["total", "value"]);
  if (pts != null) {
    const p = Math.max(0, Math.min(100, pts));
    if (p >= 62) return "nen_lam";
    if (p <= 38) return "khong_nen";
    return "trung_lap";
  }
  const lc = label.toLowerCase();
  if (goodLc.has(lc)) return "nen_lam";
  if (avoidLc.has(lc)) return "khong_nen";
  return "trung_lap";
}

function buildPurposeListFromApi(
  nested: Record<string, unknown>,
  goodFor: string[],
  avoidFor: string[],
): DayDetailPurposeRow[] | null {
  const goodLc = new Set(goodFor.map((s) => s.trim().toLowerCase()));
  const avoidLc = new Set(avoidFor.map((s) => s.trim().toLowerCase()));
  const rawLists = [
    nested.purpose_scores,
    nested.purposeScores,
    nested.intent_scores,
    nested.intentScores,
    nested.muc_dich_scores,
    nested.scores_by_intent,
    nested.by_intent,
  ];
  for (const raw of rawLists) {
    if (!Array.isArray(raw) || raw.length === 0) continue;
    const rows: DayDetailPurposeRow[] = [];
    for (const item of raw) {
      const o = asRecord(item);
      if (!o) continue;
      let label = pickStr(o, [
        "label",
        "name",
        "muc_dich",
        "intent_label",
        "title",
        "source",
      ]);
      if (!label) {
        const intent = asRecord(o.intent);
        if (intent) label = pickStr(intent, ["label", "name"]);
      }
      if (!label) continue;
      rows.push({
        label,
        verdict: verdictFromApiObject(o, label, goodLc, avoidLc),
      });
    }
    if (rows.length >= 3) return rows;
  }
  return null;
}

/** 26 mục chuẩn: khớp nhãn với `good_for` / `avoid_for`. */
function buildPurposeListFromGoodAvoid(
  goodFor: string[],
  avoidFor: string[],
): DayDetailPurposeRow[] {
  const good = new Set(goodFor.map((s) => s.trim().toLowerCase()));
  const avoid = new Set(avoidFor.map((s) => s.trim().toLowerCase()));
  return TU_TRU_INTENT_OPTIONS.filter((o) => o.value !== "MAC_DINH").map((o) => {
    const lc = o.label.toLowerCase();
    let verdict: DayDetailPurposeVerdict = "trung_lap";
    if (good.has(lc)) verdict = "nen_lam";
    else if (avoid.has(lc)) verdict = "khong_nen";
    return { label: o.label, verdict };
  });
}

function mergePurposeRowsByLabel(
  base: DayDetailPurposeRow[],
  overrides: DayDetailPurposeRow[],
): DayDetailPurposeRow[] {
  const baseKeys = new Set(base.map((r) => r.label.toLowerCase()));
  const map = new Map(overrides.map((r) => [r.label.toLowerCase(), r]));
  const out = base.map((r) => map.get(r.label.toLowerCase()) ?? r);
  for (const r of overrides) {
    if (!baseKeys.has(r.label.toLowerCase())) out.push(r);
  }
  return out;
}

function purposeVerdictSortOrder(v: DayDetailPurposeVerdict): number {
  if (v === "nen_lam") return 0;
  if (v === "trung_lap") return 1;
  return 2;
}

/** Thứ tự hiển thị: Nên làm → Cân nhắc → Không nên, rồi theo tên. */
export function sortPurposeRowsForDisplay(
  rows: DayDetailPurposeRow[],
): DayDetailPurposeRow[] {
  return [...rows].sort((a, b) => {
    const da = purposeVerdictSortOrder(a.verdict);
    const db = purposeVerdictSortOrder(b.verdict);
    if (da !== db) return da - db;
    return a.label.localeCompare(b.label, "vi");
  });
}

/** Bỏ nhấn mạnh số điểm trong luận chi tiết (UI không còn thể hiện điểm). */
function softenBreakdownReasonVi(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t || t === "—") return t;

  if (/^mọi ngày bắt đầu từ\s*\d+\s*điểm\.?$/iu.test(t)) {
    return "Mọi ngày đều có một nền cố định trước khi cộng các yếu tố khác.";
  }

  let out = t.replace(/\bbắt đầu từ\s*\d+\s*điểm\b/giu, "có nền cố định ban đầu");
  out = out.replace(/\s+([,.;:])/g, "$1");
  out = out.replace(/\s{2,}/g, " ").trim();
  return out;
}

function pickTrucDescription(
  trucPlain: string,
  reasonLines: string[],
  breakdown: DayDetailBreakdownRow[],
): string {
  const short = trucPlain.replace(/^trực\s+/i, "").trim();
  for (const line of reasonLines) {
    if (short && line.includes(short)) return line;
    if (/trực/i.test(line)) return line;
  }
  for (const row of breakdown) {
    if (/trực/i.test(row.source) && row.reasonVi && row.reasonVi !== "—") {
      return row.reasonVi;
    }
  }
  for (const row of breakdown) {
    if (/trực/i.test(row.reasonVi)) return row.reasonVi;
  }
  if (reasonLines[0]) return reasonLines[0];
  return "";
}

/** Map GET /v1/day-detail JSON → màn chi tiết (ưu tiên shape tu-tru-api). */
export function parseDayDetailForView(raw: unknown): DayDetailViewModel | null {
  const root = asRecord(raw);
  if (!root) return null;
  const nested =
    asRecord(root.data) ?? asRecord(root.result) ?? asRecord(root.payload) ?? root;

  const lunarDate = pickStr(nested, [
    "lunar_date",
    "lunar_label",
    "ngay_am_text",
    "am_lich",
  ]);
  let lunarOut = lunarDate;
  if (!lunarOut) {
    const lunarObj = asRecord(nested.lunar);
    if (lunarObj) {
      lunarOut = pickStr(lunarObj, ["display", "label", "text", "full"]);
    }
  }

  const canChi = pickStr(nested, ["can_chi", "canChi", "can_chi_day"]);

  const trucName =
    pickStr(nested, ["truc_name", "truc"]) ||
    pickStr(asRecord(nested.truc) ?? {}, ["name"]);
  const trucScore = pickNumber(nested, ["truc_score", "trucScore"]);
  let trucLine = trucName;
  if (trucName && trucScore != null) {
    trucLine = `${trucName} (${trucScore})`;
  } else if (!trucName && trucScore != null) {
    trucLine = String(trucScore);
  }

  const trucPlain = trucName.trim();
  const trucTitle =
    trucPlain && /^trực\s/i.test(trucPlain)
      ? trucPlain
      : trucPlain
        ? `Trực ${trucPlain.replace(/^trực\s+/i, "").trim()}`
        : "—";

  const starName = pickStr(nested, ["star_name", "starName"]);
  const sao28 = pickStr(nested, ["sao_28", "sao28"]);
  let starLine = starName;
  if (starName && sao28) starLine = `${starName} · ${sao28}`;
  else if (!starName && sao28) starLine = sao28;

  const score = pickNumber(nested, ["score", "diem", "total_score"]);
  const grade = pickStr(nested, ["grade", "rank", "hang"]).toUpperCase() || "—";

  const reasonLines = extractDetailReasonLines(nested);
  const goodFor = stringList(nested.good_for ?? nested.goodFor ?? nested.nen_lam);
  const avoidFor: string[] = [];
  const avoidRaw = nested.avoid_for ?? nested.avoidFor ?? nested.tranh;
  if (Array.isArray(avoidRaw)) {
    for (const x of avoidRaw) {
      if (typeof x === "string" && x.trim()) avoidFor.push(x.trim());
    }
  }

  const breakdown: DayDetailBreakdownRow[] = [];
  const br = nested.breakdown;
  if (Array.isArray(br)) {
    for (const item of br) {
      const o = asRecord(item);
      if (!o) continue;
      const source = pickStr(o, ["source", "label", "title"]) || "—";
      const pts = pickNumber(o, ["points", "point", "score"]) ?? 0;
      const reasonRaw =
        pickStr(o, ["reason_vi", "reasonVi", "reason", "note"]) || "—";
      const reasonVi = softenBreakdownReasonVi(reasonRaw);
      const type = pickStr(o, ["type", "kind"]) || "";
      breakdown.push({ source, points: pts, reasonVi, type });
    }
  }

  const trucDescription = pickTrucDescription(trucPlain, reasonLines, breakdown);

  const gioTot = formatGioSlotsHumanVi(nested, [
    "gio_tot",
    "gioTot",
    "gio_hoang_dao",
    "gioHoangDao",
    "best_hours",
  ]);
  const gioXau = formatGioSlotsHumanVi(nested, [
    "gio_xau",
    "gioXau",
    "bad_hours",
    "gio_hung",
  ]);

  const catThanLabels = dedupeLabels([
    ...labelsFromMixedArray(nested.cat_than ?? nested.catThan),
    ...labelsFromMixedArray(nested.than_sat ?? nested.thanSat),
    ...labelsFromMixedArray(nested.cai_than ?? nested.caiThan),
  ]);
  const hungSatLabels = dedupeLabels(
    labelsFromMixedArray(
      nested.hung_ngay ?? nested.hungNgay ?? nested.hung_sat ?? nested.hungSat,
    ),
  );

  const basePurposes = buildPurposeListFromGoodAvoid(goodFor, avoidFor);
  const purposeFromApi = buildPurposeListFromApi(nested, goodFor, avoidFor);
  const purposeRows = purposeFromApi
    ? mergePurposeRowsByLabel(basePurposes, purposeFromApi)
    : basePurposes;

  if (
    !lunarOut &&
    !canChi &&
    score == null &&
    grade === "—" &&
    reasonLines.length === 0 &&
    goodFor.length === 0 &&
    breakdown.length === 0
  ) {
    return null;
  }

  return {
    lunarDate: lunarOut || "—",
    canChi: canChi || "—",
    trucLine: trucLine || "—",
    starLine: starLine || "—",
    trucTitle,
    trucDescription,
    score,
    grade,
    reasonLines,
    goodFor,
    avoidFor,
    gioTot: gioTot || "—",
    gioXau: gioXau || "—",
    catThanLabels,
    hungSatLabels,
    purposeRows,
    breakdown,
  };
}
