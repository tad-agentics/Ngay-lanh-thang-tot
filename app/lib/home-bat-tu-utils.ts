import type { CalendarDay, DayType } from "~/lib/api-types";
import { verdictLabelFromScore } from "~/lib/c-score";
import { parseDayDetailForView } from "~/lib/day-detail-view";
import {
  extractChiLabelsFromGioSlots,
  formatGioTotChiCompactDisplayVi,
  formatHourRangeForDayDetailFigmaVi,
  formatHourRangeForDisplayVi,
} from "~/lib/format-gio-tot-display-vi";
import {
  parseScoreMethodology,
  type ScoreMethodologyView,
  SCORE_METHODOLOGY_DEFAULT_SUMMARY,
} from "~/lib/score-methodology";

export function asRecord(x: unknown): Record<string, unknown> | null {
  if (x && typeof x === "object" && !Array.isArray(x)) {
    return x as Record<string, unknown>;
  }
  return null;
}

export function pickStr(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/** tu-tru-api: `can_chi` string hoặc `{ name, can_name, chi_name }`. */
export function pickCanChiLabel(
  obj: Record<string, unknown>,
  keys: string[],
): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    const nested = asRecord(v);
    if (!nested) continue;
    const name = pickStr(nested, ["name", "label", "display", "full"]);
    if (name) return name;
    const can = pickStr(nested, ["can_name", "canName"]);
    const chi = pickStr(nested, ["chi_name", "chiName"]);
    if (can && chi) return `${can} ${chi}`;
    if (can) return can;
    if (chi) return chi;
  }
  return "";
}

export function yearCanChiFromLunarDisplay(display: string): string {
  const m = /năm\s+([A-Za-zÀ-ỹ]+(?:\s+[A-Za-zÀ-ỹ]+)?)\s*$/iu.exec(display.trim());
  return m?.[1]?.trim() ?? "";
}

export function pickYearCanChiFromLunar(obj: Record<string, unknown>): string {
  const lunar = asRecord(obj.lunar);
  if (!lunar) return "";
  const direct = pickStr(lunar, [
    "year_can_chi",
    "yearCanChi",
    "can_chi_year",
    "canChiYear",
  ]);
  if (direct) return direct;
  const display = pickStr(lunar, ["display", "label", "text", "full"]);
  return display ? yearCanChiFromLunarDisplay(display) : "";
}

export function pickNumber(obj: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
    if (typeof v === "string" && /^\d+$/.test(v.trim())) {
      return Number.parseInt(v.trim(), 10);
    }
  }
  return null;
}

/** Edge `lich-thang` expects `month` as YYYY-MM. */
export function formatLichThangMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function labelsFromMixedArray(raw: unknown): string[] {
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

export function dedupeLabels(labels: string[]): string[] {
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

export function stringGoodForList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((s) => s.trim());
}

const PLACEHOLDER_ADVICE_RE =
  /^không có gì đặc biệt\.?$/iu;

/** tu-tru-api: `daily_advice.nen_lam` — "Phù hợp: Khai trương, Ký kết." */
export function parseAdviceStringToActivities(text: string): string[] {
  const t = text.trim();
  if (!t || PLACEHOLDER_ADVICE_RE.test(t)) return [];

  const phuHop = /phù hợp\s*:\s*(.+?)(?:\.|$)/iu.exec(t);
  if (phuHop?.[1]) {
    return phuHop[1]
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const tranh = /(?:nên tránh|tránh)\s*:\s*(.+?)(?:\.|$)/iu.exec(t);
  if (tranh?.[1]) {
    return tranh[1]
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (t.length < 120 && !/—|thuận lợi|hoàng đạo|hắc đạo/iu.test(t)) {
    const parts = t.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1) return parts;
  }

  if (t.length <= 96) return [t];
  return [];
}

export function parseActivityList(raw: unknown): string[] {
  if (Array.isArray(raw)) return stringGoodForList(raw);
  if (typeof raw === "string" && raw.trim()) {
    return parseAdviceStringToActivities(raw);
  }
  return [];
}

export function labelsFromSummaryBlock(
  nested: Record<string, unknown>,
  key: "tot" | "xau",
): string[] {
  const summary = asRecord(nested.summary);
  if (!summary) return [];
  const alt = key === "tot" ? "good" : "bad";
  return labelsFromMixedArray(summary[key] ?? summary[alt]);
}

const WEEKDAY_SHORT_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"] as const;

const LUNAR_MONTH_VI = [
  "Giêng",
  "Hai",
  "Ba",
  "Tư",
  "Năm",
  "Sáu",
  "Bảy",
  "Tám",
  "Chín",
  "Mười",
  "Mười Một",
  "Chạp",
] as const;

/** Maket lịch tháng: `Tháng Tư âm`. */
export function lunarMonthLabelVi(monthNum: number): string | null {
  if (!Number.isFinite(monthNum) || monthNum < 1 || monthNum > 12) return null;
  return `Tháng ${LUNAR_MONTH_VI[monthNum - 1]} âm`;
}

/** Âm lịch tháng từ payload `lich-thang` (cột `lunar_month` trên day row). */
export function parseLichThangLunarMonthLabel(raw: unknown): string | null {
  const root = asRecord(raw);
  if (!root) return null;
  const nested =
    asRecord(root.data) ?? asRecord(root.result) ?? asRecord(root.payload) ?? root;

  const direct = pickNumber(nested, ["lunar_month", "lunarMonth", "thang_am"]);
  if (direct != null && direct >= 1 && direct <= 12) {
    return lunarMonthLabelVi(direct);
  }

  for (const row of extractDayArray(nested)) {
    const o = asRecord(row);
    if (!o) continue;
    const { lunarMonth } = pickLunarDayMonth(o);
    if (lunarMonth >= 1 && lunarMonth <= 12) {
      return lunarMonthLabelVi(lunarMonth);
    }
  }
  return null;
}

/** Nhãn kiểu maket: `T6 15/05/2026`. */
export function formatViWeekdayShortDayMonth(iso: string): string {
  const parts = iso.trim().slice(0, 10).split("-");
  if (parts.length !== 3) return iso;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (![y, m, d].every((n) => Number.isFinite(n))) return iso;
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return iso;
  const wd = WEEKDAY_SHORT_VI[dt.getDay()] ?? "";
  return `${wd} ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

/** Dòng phụ đầu trang Hôm nay: `T2 · 11/05/2026 · Bính Tuất`. */
export function formatHomeHeaderSubline(iso: string, canChi: string): string {
  const parts = iso.trim().slice(0, 10).split("-");
  if (parts.length !== 3) return canChi.trim() || "—";
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (![y, m, d].every((n) => Number.isFinite(n))) {
    return canChi.trim() || "—";
  }
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return canChi.trim() || "—";
  const wd = WEEKDAY_SHORT_VI[dt.getDay()] ?? "";
  const datePart = `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
  const head = `${wd} · ${datePart}`;
  const cc = canChi.trim();
  return cc ? `${head} · ${cc}` : head;
}

export function parseToIsoDate(raw: string): string | null {
  const t = raw.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dm = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
  if (dm) {
    const d = dm[1].padStart(2, "0");
    const m = dm[2].padStart(2, "0");
    return `${dm[3]}-${m}-${d}`;
  }
  return null;
}

export function pickIsoFromUnknown(data: unknown): string | null {
  const root = asRecord(data) ?? {};
  const keys = [
    "target_date",
    "solar_date",
    "date_solar",
    "ngay_duong",
    "ngay_duong_lich",
    "date",
    "ngay",
  ];
  for (const k of keys) {
    const v = root[k];
    if (typeof v === "string") {
      const iso = parseToIsoDate(v);
      if (iso) return iso;
    }
  }
  return null;
}

export function formatViDateFromIso(iso: string): string {
  const parts = iso.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (y == null || m == null || d == null) return iso;
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return iso;
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dt);
}

export function inferDayType(obj: Record<string, unknown>): DayType {
  const badge = pickStr(obj, ["badge", "dao_badge", "loai_badge"]).toLowerCase();
  if (badge.includes("hoang")) return "hoang-dao";
  if (badge.includes("hac")) return "hac-dao";

  const label = pickStr(obj, [
    "day_type",
    "loai_ngay",
    "loai",
    "type",
    "dao_type",
  ]).toLowerCase();
  if (
    label.includes("hoang") ||
    label.includes("hoàng") ||
    label.includes("yellow")
  ) {
    return "hoang-dao";
  }
  if (label.includes("hac") || label.includes("hắc") || label.includes("black")) {
    return "hac-dao";
  }

  const hoangBlock = asRecord(obj.hoang_dao) ?? asRecord(obj.hoangDao);
  if (hoangBlock && hoangBlock.is_hoang_dao === true) {
    return "hoang-dao";
  }

  const hoang =
    obj.hoang_dao === true ||
    obj.is_hoang_dao === true ||
    obj.hoangDao === true;
  const hac =
    obj.hac_dao === true || obj.is_hac_dao === true || obj.hacDao === true;
  if (hoang && !hac) return "hoang-dao";
  if (hac && !hoang) return "hac-dao";

  const n = obj.dao_flag ?? obj.flag_dao;
  if (n === 1 || n === "1" || n === "hoang") return "hoang-dao";
  if (n === -1 || n === "-1" || n === "hac") return "hac-dao";

  return "neutral";
}

/** tu-tru-api: `gio_tot` / `gio_hoang_dao` — mảng `{ chi_name, range }`. */
export function formatChiRangeHourSlots(raw: unknown): string {
  if (!Array.isArray(raw)) return "";
  const parts: string[] = [];
  for (const item of raw) {
    const o = asRecord(item);
    if (!o) continue;
    const chi = pickStr(o, ["chi_name", "label", "name"]);
    const range = pickStr(o, ["range", "gio", "time", "label_gio"]);
    if (chi && range) parts.push(`${chi} ${range}`);
    else if (range) parts.push(range);
    else if (chi) parts.push(chi);
  }
  return parts.join("; ");
}

export function pickLunarDayMonth(obj: Record<string, unknown>): {
  lunarDay: number;
  lunarMonth: number;
} {
  const dKeys = ["lunar_day", "ngay_am", "ngay_am_lich", "lunarDay", "am_lich"];
  const mKeys = ["lunar_month", "thang_am", "lunarMonth"];
  let lunarDay = 0;
  let lunarMonth = 0;
  for (const k of dKeys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) {
      lunarDay = Math.floor(v);
      break;
    }
    if (typeof v === "string" && /^\d+$/.test(v)) {
      lunarDay = Number.parseInt(v, 10);
      break;
    }
  }
  for (const k of mKeys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) {
      lunarMonth = Math.floor(v);
      break;
    }
    if (typeof v === "string" && /^\d+$/.test(v)) {
      lunarMonth = Number.parseInt(v, 10);
      break;
    }
  }
  return { lunarDay, lunarMonth };
}

const DAY_ARRAY_KEYS = [
  "days",
  "top_dates",
  "recommended_dates",
  "ngay_trong_thang",
  "calendar",
  "lich",
  "items",
  "dates",
];

export function extractDayArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const root = asRecord(data);
  if (!root) return [];
  for (const k of DAY_ARRAY_KEYS) {
    const v = root[k];
    if (Array.isArray(v)) return v;
  }
  for (const v of Object.values(root)) {
    if (Array.isArray(v) && v.length > 0 && asRecord(v[0])) return v as unknown[];
  }
  return [];
}

export function pickIsoFromDayRow(obj: Record<string, unknown>): string | null {
  const direct = pickIsoFromUnknown(obj);
  if (direct) return direct;
  const y = obj.year;
  const m = obj.month;
  const d = obj.day;
  if (
    typeof y === "number" &&
    typeof m === "number" &&
    typeof d === "number"
  ) {
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return null;
}
