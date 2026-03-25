import { extractDetailReasonLines } from "~/lib/chon-ngay-detail";
import { formatHourRangeForDisplayVi } from "~/lib/format-gio-tot-display-vi";

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

/** Giờ Hoàng/Hắc đạo: cùng định dạng đọc được như thẻ Hôm nay (vd. 7–9 giờ sáng · …). */
function formatGioSlotsHumanVi(
  nested: Record<string, unknown>,
  keys: string[],
): string {
  const arr = firstNonEmptySlotArray(nested, keys);
  if (!arr) return "—";
  const s = formatHourRangeForDisplayVi("", arr);
  return s === "—" ? "—" : s;
}

export interface DayDetailBreakdownRow {
  source: string;
  points: number;
  reasonVi: string;
  type: string;
}

export interface DayDetailViewModel {
  lunarDate: string;
  canChi: string;
  trucLine: string;
  starLine: string;
  score: number | null;
  grade: string;
  reasonLines: string[];
  goodFor: string[];
  avoidFor: string[];
  gioTot: string;
  gioXau: string;
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

  const breakdown: DayDetailBreakdownRow[] = [];
  const br = nested.breakdown;
  if (Array.isArray(br)) {
    for (const item of br) {
      const o = asRecord(item);
      if (!o) continue;
      const source = pickStr(o, ["source", "label", "title"]) || "—";
      const pts = pickNumber(o, ["points", "point", "score"]) ?? 0;
      const reasonVi =
        pickStr(o, ["reason_vi", "reasonVi", "reason", "note"]) || "—";
      const type = pickStr(o, ["type", "kind"]) || "";
      breakdown.push({ source, points: pts, reasonVi, type });
    }
  }

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
    score,
    grade,
    reasonLines,
    goodFor,
    avoidFor,
    gioTot: gioTot || "—",
    gioXau: gioXau || "—",
    breakdown,
  };
}
