import type { CalendarDay, DayType } from "~/lib/api-types";

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

function formatViDateFromIso(iso: string): string {
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
  lunarLabel: string;
  hourRange: string;
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

  const lunarLabel = pickStr(nested, [
    "lunar_label",
    "ngay_am_text",
    "am_lich",
    "lunar_text",
    "label_am",
  ]) || pickStr(root, ["lunar_label", "lunar_text"]);

  let dayType = inferDayType(nested);
  if (dayType === "neutral") dayType = inferDayType(root);

  const hourRange = pickStr(nested, [
    "good_hours",
    "gio_tot",
    "hours_tot",
    "best_hours",
    "gio_hoang_dao",
  ]) || pickStr(root, ["good_hours", "gio_tot"]);

  return {
    dayType,
    solarDateVi,
    lunarLabel: lunarLabel || "—",
    hourRange: hourRange || "—",
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
      byIso.set(iso, {
        isoDate: iso,
        dayType,
        isToday: iso === todayIso,
        lunarDay,
        lunarMonth,
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
