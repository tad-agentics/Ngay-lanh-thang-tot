import {
  parseScoreMethodology,
  type ScoreMethodologyView,
} from "~/lib/score-methodology";
import * as U from "~/lib/home-bat-tu-utils";
import {
  formatViDateFromIso,
  formatViWeekdayShortDayMonth,
} from "~/lib/home-bat-tu-utils";

/** OpenAPI `LichThangResponse.score_methodology`. */
export function parseLichThangScoreMethodology(
  raw: unknown,
): ScoreMethodologyView | null {
  const root = U.asRecord(raw);
  if (!root) return null;
  return parseScoreMethodology(root.score_methodology);
}

/** Good-day count for weekly teaser; `null` if engine shape unknown. */
export function parseWeeklyGoodDayCount(raw: unknown): number | null {
  const root = U.asRecord(raw);
  if (!root) return null;
  const nested =
    U.asRecord(root.data) ?? U.asRecord(root.result) ?? U.asRecord(root.summary) ?? root;

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
      const o = U.asRecord(row);
      if (!o) continue;
      const grade = U.pickStr(o, ["grade", "rank", "hang"]).toUpperCase();
      const s = typeof o.score === "number" ? o.score : Number(o.score);
      if (grade === "A" || grade === "B" || (Number.isFinite(s) && s >= 70)) {
        good++;
      }
    }
    if (good > 0) return good;
  }

  const arr = U.extractDayArray(nested);
  if (arr.length > 0) {
    let good = 0;
    for (const row of arr) {
      const o = U.asRecord(row);
      if (!o) continue;
      const t = U.inferDayType(o);
      const grade = U.pickStr(o, ["grade", "rank", "hang"]).toUpperCase();
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
    const o = U.asRecord(item);
    if (!o) continue;
    const chi = U.pickStr(o, ["chi_name", "label", "name"]);
    const range = U.pickStr(o, ["range", "gio", "time"]);
    if (chi && range) parts.push(`${chi} ${range}`);
    else if (range) parts.push(range);
    else if (chi) parts.push(chi);
  }
  return parts.length ? parts.join("; ") : "—";
}

/** Full-screen weekly summary: `top_dates`, week range, intent (tu-tru-api GET /v1/weekly-summary). */
export function parseWeeklySummaryForScreen(raw: unknown): WeeklySummaryScreen | null {
  const root = U.asRecord(raw);
  if (!root) return null;
  const nested =
    U.asRecord(root.data) ?? U.asRecord(root.result) ?? U.asRecord(root.payload) ?? root;

  const weekStart = U.pickStr(nested, ["week_start", "weekStart", "start"]);
  const weekEnd = U.pickStr(nested, ["week_end", "weekEnd", "end"]);
  const weekRangeLabel =
    weekStart && weekEnd
      ? formatWeekRangeLabelVi(weekStart, weekEnd)
      : weekStart || weekEnd || "—";

  const intent = U.pickStr(nested, ["intent", "muc_dich", "purpose"]) || "—";

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
      const o = U.asRecord(row);
      if (!o) continue;
      const iso = U.pickIsoFromDayRow(o);
      if (!iso) continue;
      const g = U.pickStr(o, ["grade", "rank", "hang"]).toUpperCase() || "—";
      const sVal = o.score;
      const score =
        typeof sVal === "number" && Number.isFinite(sVal)
          ? sVal
          : typeof sVal === "string" && /^\d+$/.test(sVal)
            ? Number.parseInt(sVal, 10)
            : null;
      const oneLiner =
        U.pickStr(o, [
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
