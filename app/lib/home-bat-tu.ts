import type { CalendarDay, DayType } from "~/lib/api-types";
import { parseDayDetailForView } from "~/lib/day-detail-view";
import {
  extractChiLabelsFromGioSlots,
  formatGioTotChiCompactDisplayVi,
  formatHourRangeForDayDetailFigmaVi,
  formatHourRangeForDisplayVi,
} from "~/lib/format-gio-tot-display-vi";

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

function pickYearCanChiFromLunar(obj: Record<string, unknown>): string {
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

function pickNumber(obj: Record<string, unknown>, keys: string[]): number | null {
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

function stringGoodForList(raw: unknown): string[] {
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

function parseActivityList(raw: unknown): string[] {
  if (Array.isArray(raw)) return stringGoodForList(raw);
  if (typeof raw === "string" && raw.trim()) {
    return parseAdviceStringToActivities(raw);
  }
  return [];
}

function labelsFromSummaryBlock(
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

function parseToIsoDate(raw: string): string | null {
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

function pickIsoFromUnknown(data: unknown): string | null {
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

function inferDayType(obj: Record<string, unknown>): DayType {
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
function formatChiRangeHourSlots(raw: unknown): string {
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

function pickLunarDayMonth(obj: Record<string, unknown>): {
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

function extractDayArray(data: unknown): unknown[] {
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

function pickIsoFromDayRow(obj: Record<string, unknown>): string | null {
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

export interface NgayHomNayHome {
  dayType: DayType;
  solarDateVi: string;
  /** Maket header: `T2 · DD/MM/YYYY · Can Chi`. */
  headerSubline: string;
  lunarLabel: string;
  hourRange: string;
  canChi: string;
  /** Can Chi năm âm lịch — masthead `Tháng M · YYYY · Bính Ngọ`. */
  yearCanChi: string;
  /** Tên trực (không lặp tiền tố "Trực "). */
  trucDisplay: string;
  saoTotCsv: string;
  saoXauCsv: string;
  goodForChips: string[];
  avoidForChips: string[];
  gioTotChis: string[];
  /** Maket lịch tờ: `Thìn 7–9h, Mùi 13–15h`. */
  gioTotDisplay: string;
  gioXauChis: string[];
  homeSummaryLine: string;
  /** Personalized score 0–100 from day-detail when merged; ngay-hom-nay may omit. */
  score: number | null;
}

/** Canonical personalized score lives on day-detail; ngay-hom-nay often omits it. */
export function mergeDayDetailScoreIntoHome(
  home: NgayHomNayHome,
  dayDetailRaw: unknown,
): NgayHomNayHome {
  const detail = parseDayDetailForView(dayDetailRaw);
  if (detail?.score != null && Number.isFinite(detail.score)) {
    return { ...home, score: detail.score };
  }
  return home;
}

/** Map engine /v1/ngay-hom-nay JSON → home cards (flexible keys). */
export function parseNgayHomNayForHome(raw: unknown): NgayHomNayHome | null {
  const root = asRecord(raw);
  if (!root) return null;
  const nested =
    asRecord(root.data) ?? asRecord(root.result) ?? asRecord(root.payload) ?? root;

  const fallbackIso = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  })();

  const iso = pickIsoFromUnknown(nested) ?? pickIsoFromUnknown(root);
  const canChi =
    pickCanChiLabel(nested, [
      "can_chi",
      "canChi",
      "can_chi_day",
      "can_chi_ngay",
    ]) || pickCanChiLabel(root, ["can_chi", "canChi"]);
  let solarDateVi = iso
    ? formatViDateFromIso(iso)
    : pickStr(nested, [
        "solar_label",
        "label_duong",
        "ngay_duong_text",
        "solar_text",
      ]) || pickStr(root, ["solar_label", "solar_text"]);

  if (!solarDateVi) {
    solarDateVi = formatViDateFromIso(iso ?? fallbackIso);
  }

  let lunarLabel =
    pickStr(nested, [
      "lunar_label",
      "ngay_am_text",
      "am_lich",
      "lunar_text",
      "label_am",
      "lunar_date",
    ]) || pickStr(root, ["lunar_label", "lunar_text", "lunar_date"]);
  if (!lunarLabel) {
    const lunarObj = asRecord(nested.lunar) ?? asRecord(root.lunar);
    if (lunarObj) {
      lunarLabel = pickStr(lunarObj, ["display", "label", "text", "full"]);
    }
  }

  const yearCanChi =
    pickYearCanChiFromLunar(nested) ||
    pickYearCanChiFromLunar(root) ||
    (lunarLabel ? yearCanChiFromLunarDisplay(lunarLabel) : "") ||
    "—";

  let dayType = inferDayType(nested);
  if (dayType === "neutral") dayType = inferDayType(root);

  let hourRange = pickStr(nested, [
    "good_hours",
    "gio_tot",
    "hours_tot",
    "best_hours",
    "gio_hoang_dao",
  ]) || pickStr(root, ["good_hours", "gio_tot"]);
  if (!hourRange) {
    const fromNested =
      formatChiRangeHourSlots(nested.gio_tot) ||
      formatChiRangeHourSlots(nested.gio_hoang_dao) ||
      formatChiRangeHourSlots(root.gio_tot);
    if (fromNested) hourRange = fromNested;
  }

  const slotSources =
    nested.gio_tot ?? nested.gio_hoang_dao ?? root.gio_tot;
  const hourDisplay = formatHourRangeForDisplayVi(hourRange, slotSources);

  const headerIso = iso ?? fallbackIso;
  const headerSubline = formatHomeHeaderSubline(headerIso, canChi);

  const trucRaw =
    pickStr(nested, ["truc_name", "truc"]) ||
    pickStr(asRecord(nested.truc) ?? {}, ["name"]);
  const trucDisplay =
    (trucRaw.replace(/^trực\s+/i, "").trim() || trucRaw.trim()) || "—";

  const hoangDao = asRecord(nested.hoang_dao ?? nested.hoangDao);
  const starName = hoangDao ? pickStr(hoangDao, ["star_name", "starName"]) : "";
  const isHoangDao = hoangDao?.is_hoang_dao === true;
  const isHacDao = hoangDao?.is_hoang_dao === false;

  const catThanLabels = dedupeLabels([
    ...labelsFromMixedArray(nested.cat_than ?? nested.catThan),
    ...labelsFromMixedArray(nested.than_sat ?? nested.thanSat),
    ...labelsFromMixedArray(nested.cai_than ?? nested.caiThan),
    ...labelsFromSummaryBlock(nested, "tot"),
    ...(starName && (isHoangDao || (!isHacDao && dayType === "hoang-dao"))
      ? [starName]
      : []),
  ]);
  const hungSatLabels = dedupeLabels([
    ...labelsFromMixedArray(
      nested.hung_ngay ?? nested.hungNgay ?? nested.hung_sat ?? nested.hungSat,
    ),
    ...labelsFromSummaryBlock(nested, "xau"),
    ...(starName && isHacDao ? [`Hắc Đạo (${starName})`] : []),
  ]);
  const saoTotCsv = catThanLabels.length ? catThanLabels.join(", ") : "—";
  const saoXauCsv = hungSatLabels.length ? hungSatLabels.join(", ") : "—";

  const dailyAdvice =
    asRecord(nested.daily_advice ?? nested.dailyAdvice) ?? {};

  const goodForChips = dedupeLabels([
    ...parseActivityList(nested.good_for ?? nested.goodFor),
    ...parseActivityList(dailyAdvice.nen_lam ?? dailyAdvice.nenLam),
    ...parseActivityList(nested.nen_lam ?? nested.nenLam),
  ]);

  const avoidForChips = dedupeLabels([
    ...parseActivityList(nested.avoid_for ?? nested.avoidFor ?? nested.tranh),
    ...parseActivityList(dailyAdvice.nen_tranh ?? dailyAdvice.nenTranh),
    ...parseActivityList(nested.nen_tranh ?? nested.nenTranh),
  ]);

  const gioTotChis = extractChiLabelsFromGioSlots(
    nested.gio_tot ?? nested.gioTot ?? nested.gio_hoang_dao ?? nested.gioHoangDao,
  );
  const gioTotDisplay =
    formatGioTotChiCompactDisplayVi(slotSources) ||
    formatHourRangeForDayDetailFigmaVi(hourRange, slotSources) ||
    hourDisplay ||
    (gioTotChis.length > 0 ? gioTotChis.join(", ") : "—");
  const gioXauChis = extractChiLabelsFromGioSlots(
    nested.gio_xau ?? nested.gioXau ?? nested.bad_hours ?? nested.gio_hung,
  );

  const homeSummaryLine =
    pickStr(nested, [
      "summary_vi",
      "summaryVi",
      "one_liner",
      "oneLiner",
      "reason_vi",
      "reasonVi",
      "hint_vi",
    ]) || pickStr(root, ["summary_vi", "one_liner"]);

  let score =
    pickNumber(nested, ["score", "diem", "total_score", "totalScore"]) ??
    pickNumber(asRecord(nested.scores) ?? {}, ["total", "value", "score"]) ??
    pickNumber(root, ["score", "diem"]);

  return {
    dayType,
    solarDateVi,
    headerSubline,
    lunarLabel: lunarLabel || "—",
    hourRange: hourDisplay || "—",
    canChi: canChi || "—",
    yearCanChi,
    trucDisplay,
    saoTotCsv,
    saoXauCsv,
    goodForChips,
    avoidForChips,
    gioTotChis,
    gioTotDisplay,
    gioXauChis,
    homeSummaryLine,
    score,
  };
}

/** Good-day count for weekly teaser; `null` if engine shape unknown. */
export function parseWeeklyGoodDayCount(raw: unknown): number | null {
  const root = asRecord(raw);
  if (!root) return null;
  const nested =
    asRecord(root.data) ?? asRecord(root.result) ?? asRecord(root.summary) ?? root;

  const countKeys = [
    "good_day_count",
    "good_days",
    "hoang_dao_count",
    "top_count",
    "count",
  ];
  for (const k of countKeys) {
    const v = nested[k];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) return Math.floor(v);
    if (typeof v === "string" && /^\d+$/.test(v)) return Number.parseInt(v, 10);
  }

  const topDates = nested.top_dates ?? nested.topDates;
  if (Array.isArray(topDates) && topDates.length > 0) {
    let good = 0;
    for (const row of topDates) {
      const o = asRecord(row);
      if (!o) continue;
      const grade = pickStr(o, ["grade", "rank", "hang"]).toUpperCase();
      const s = typeof o.score === "number" ? o.score : Number(o.score);
      if (grade === "A" || grade === "B" || (Number.isFinite(s) && s >= 70)) {
        good++;
      }
    }
    if (good > 0) return good;
  }

  const arr = extractDayArray(nested);
  if (arr.length > 0) {
    let good = 0;
    for (const row of arr) {
      const o = asRecord(row);
      if (!o) continue;
      const t = inferDayType(o);
      const grade = pickStr(o, ["grade", "rank", "hang"]).toUpperCase();
      if (t === "hoang-dao" || grade === "A" || grade === "B") good++;
    }
    return good;
  }

  return null;
}

export interface WeeklyTopDateRow {
  isoDate: string;
  dateLabelVi: string;
  /** Maket: `T6 15/05/2026`. */
  dateShortVi: string;
  grade: string;
  score: number | null;
  oneLiner: string;
  bestHours: string;
}

export interface WeeklySummaryScreen {
  weekStart: string;
  weekEnd: string;
  weekRangeLabel: string;
  intent: string;
  /** API `count` when present; else derived from `top_dates` length. */
  summaryCount: number | null;
  rows: WeeklyTopDateRow[];
}

function formatWeekRangeLabelVi(startIso: string, endIso: string): string {
  const p1 = startIso.trim().slice(0, 10).split("-");
  const p2 = endIso.trim().slice(0, 10).split("-");
  if (p1.length !== 3 || p2.length !== 3) return `${startIso} – ${endIso}`;
  const [y1, m1, d1] = p1.map(Number);
  const [y2, m2, d2] = p2.map(Number);
  if (
    y1 === y2 &&
    m1 === m2 &&
    Number.isFinite(d1) &&
    Number.isFinite(d2)
  ) {
    return `${d1}–${d2} tháng ${m1}, ${y1}`;
  }
  return `${formatViDateFromIso(startIso)} – ${formatViDateFromIso(endIso)}`;
}

function formatBestHoursFromWeeklyRow(obj: Record<string, unknown>): string {
  const slots = obj.best_hours ?? obj.bestHours ?? obj.time_slots ?? obj.timeSlots;
  if (!Array.isArray(slots)) return "—";
  const parts: string[] = [];
  for (const item of slots) {
    const o = asRecord(item);
    if (!o) continue;
    const chi = pickStr(o, ["chi_name", "label", "name"]);
    const range = pickStr(o, ["range", "gio", "time"]);
    if (chi && range) parts.push(`${chi} ${range}`);
    else if (range) parts.push(range);
    else if (chi) parts.push(chi);
  }
  return parts.length ? parts.join("; ") : "—";
}

/** Full-screen weekly summary: `top_dates`, week range, intent (tu-tru-api GET /v1/weekly-summary). */
export function parseWeeklySummaryForScreen(raw: unknown): WeeklySummaryScreen | null {
  const root = asRecord(raw);
  if (!root) return null;
  const nested =
    asRecord(root.data) ?? asRecord(root.result) ?? asRecord(root.payload) ?? root;

  const weekStart = pickStr(nested, ["week_start", "weekStart", "start"]);
  const weekEnd = pickStr(nested, ["week_end", "weekEnd", "end"]);
  const weekRangeLabel =
    weekStart && weekEnd
      ? formatWeekRangeLabelVi(weekStart, weekEnd)
      : weekStart || weekEnd || "—";

  const intent = pickStr(nested, ["intent", "muc_dich", "purpose"]) || "—";

  let summaryCount: number | null = null;
  const cRaw = nested.count ?? nested.good_day_count;
  if (typeof cRaw === "number" && Number.isFinite(cRaw) && cRaw >= 0) {
    summaryCount = Math.floor(cRaw);
  } else if (typeof cRaw === "string" && /^\d+$/.test(cRaw)) {
    summaryCount = Number.parseInt(cRaw, 10);
  }

  const topRaw = nested.top_dates ?? nested.topDates ?? nested.recommended_dates;
  const rows: WeeklyTopDateRow[] = [];
  if (Array.isArray(topRaw)) {
    for (const row of topRaw) {
      const o = asRecord(row);
      if (!o) continue;
      const iso = pickIsoFromDayRow(o) ?? pickIsoFromUnknown(o);
      if (!iso) continue;
      const g = pickStr(o, ["grade", "rank", "hang"]).toUpperCase() || "—";
      const sVal = o.score;
      const score =
        typeof sVal === "number" && Number.isFinite(sVal)
          ? sVal
          : typeof sVal === "string" && /^\d+$/.test(sVal)
            ? Number.parseInt(sVal, 10)
            : null;
      const oneLiner =
        pickStr(o, [
          "one_liner",
          "oneLiner",
          "reason_vi",
          "summary_vi",
          "summary",
        ]) || "—";
      rows.push({
        isoDate: iso,
        dateLabelVi: formatViDateFromIso(iso),
        dateShortVi: formatViWeekdayShortDayMonth(iso),
        grade: g,
        score,
        oneLiner,
        bestHours: formatBestHoursFromWeeklyRow(o),
      });
    }
  }

  if (rows.length === 0 && !weekStart && !weekEnd && summaryCount === null) {
    return null;
  }

  if (summaryCount === null && rows.length > 0) summaryCount = rows.length;

  return {
    weekStart: weekStart || "",
    weekEnd: weekEnd || "",
    weekRangeLabel,
    intent,
    summaryCount,
    rows,
  };
}

/** Build calendar days for `month`/`year`; merges engine month payload when present. */
export function buildCalendarDaysForMonth(
  month: number,
  year: number,
  lichThangPayload: unknown | null,
): CalendarDay[] {
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const daysInMonth = new Date(year, month, 0).getDate();
  const byIso = new Map<string, CalendarDay>();

  if (lichThangPayload != null) {
    for (const row of extractDayArray(lichThangPayload)) {
      const o = asRecord(row);
      if (!o) continue;
      const iso = pickIsoFromDayRow(o);
      if (!iso) continue;
      const dayType = inferDayType(o);
      const { lunarDay, lunarMonth } = pickLunarDayMonth(o);
      const score =
        pickNumber(o, ["score", "diem", "total_score", "totalScore"]) ??
        pickNumber(asRecord(o.scores) ?? {}, ["total", "value", "score"]);
      byIso.set(iso, {
        isoDate: iso,
        dayType,
        isToday: iso === todayIso,
        lunarDay,
        lunarMonth,
        score,
      });
    }
  }

  const out: CalendarDay[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const isoDate = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const existing = byIso.get(isoDate);
    if (existing) {
      out.push({ ...existing, isToday: isoDate === todayIso });
    } else {
      out.push({
        isoDate,
        dayType: "neutral",
        isToday: isoDate === todayIso,
        lunarDay: 0,
        lunarMonth: 0,
      });
    }
  }
  return out;
}
