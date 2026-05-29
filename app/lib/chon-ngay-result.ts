import type { ResultDay, ResultGrade } from "~/lib/api-types";
import { scoreToLetterGrade } from "~/lib/score-grade";
import {
  parseScoreMethodology,
  type ScoreMethodologyView,
} from "~/lib/score-methodology";

function asRecord(x: unknown): Record<string, unknown> | null {
  if (x && typeof x === "object" && !Array.isArray(x)) {
    return x as Record<string, unknown>;
  }
  return null;
}

function extractCandidateArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const root = asRecord(data);
  if (!root) return [];
  return Array.isArray(root.ranked_days) ? root.ranked_days : [];
}

/** API prose when chon-ngay returns zero candidates (HTTP 200). */
export function parseChonNgayEmptyReasonVi(data: unknown): string | null {
  const root = asRecord(data);
  if (!root) return null;
  const v = root.empty_reason_vi ?? root.emptyReasonVi;
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export function parseChonNgayScoreMethodology(
  data: unknown,
): ScoreMethodologyView | null {
  const root = asRecord(data);
  if (!root) return null;
  return parseScoreMethodology(root.score_methodology);
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

function pickIsoFromObject(obj: Record<string, unknown>): string | null {
  const keys = [
    "solar_date",
    "iso_date",
    "date_solar",
    "gregorian",
    "date",
    "ngay",
    "target_date",
    "day",
    "solar",
  ];
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string") {
      const iso = parseToIsoDate(v);
      if (iso) return iso;
    }
  }
  return null;
}

function formatViDateLabel(iso: string): string {
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

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "—";
}

function formatTimeSlots(arr: unknown): string {
  if (!Array.isArray(arr)) return "—";
  const parts: string[] = [];
  for (const item of arr) {
    const o = asRecord(item);
    if (!o) continue;
    const chi = pickString(o, ["chi_name", "label", "name"]);
    const range = pickString(o, ["range", "gio", "time"]);
    if (chi !== "—" && range !== "—") parts.push(`${chi} ${range}`);
    else if (range !== "—") parts.push(range);
    else if (chi !== "—") parts.push(chi);
  }
  return parts.length ? parts.join("; ") : "—";
}

function pickHours(obj: Record<string, unknown>): string {
  const keys = ["good_hours", "gio_tot", "hours_tot", "hours", "best_hours"];
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
      return (v as string[]).join(", ");
    }
  }
  const slots = formatTimeSlots(obj.time_slots ?? obj.timeSlots ?? obj.gio_hoang_dao);
  if (slots !== "—") return slots;
  return "—";
}

function pickBestHourSlots(obj: Record<string, unknown>): unknown {
  const v =
    obj.gio_tot ?? obj.gio_hoang_dao ?? obj.time_slots ?? obj.timeSlots;
  return Array.isArray(v) && v.length > 0 ? v : undefined;
}

function gradeFromIndex(i: number): ResultGrade {
  if (i === 0) return "A";
  if (i === 1) return "B";
  return "C";
}

/** UI body on `/tra-cuu/ket-qua` — `reason_vi` first; legacy `reasons[]` only if prose absent. */
function pickReasonsForUi(obj: Record<string, unknown>): string[] {
  const prose = pickString(obj, [
    "reason_vi",
    "summary_vi",
    "one_liner",
    "summary",
    "mo_ta",
  ]);
  if (prose !== "—") return [prose];

  const r = obj.reasons ?? obj.ly_do ?? obj.giai_thich;
  if (
    Array.isArray(r) &&
    r.length > 0 &&
    r.every((x) => typeof x === "string")
  ) {
    return r as string[];
  }
  return [];
}

/** `sourceIndex` = position in API array (0-based); drives default A/B/C when rank/score absent. */
function mapOneDay(raw: unknown, sourceIndex: number): ResultDay | null {
  const obj = asRecord(raw);
  if (!obj) return null;
  const isoDate = pickIsoFromObject(obj);
  if (!isoDate) return null;

  let grade = gradeFromIndex(sourceIndex);
  const score = obj.score ?? obj.total_score ?? obj.rank_score;
  if (typeof score === "number") {
    grade = scoreToLetterGrade(score);
  }
  const rk = obj.rank;
  if (typeof rk === "number" && rk >= 1 && rk <= 3) {
    grade = gradeFromIndex(rk - 1);
  }

  const reasons = pickReasonsForUi(obj);

  const bestHourSlots = pickBestHourSlots(obj);

  return {
    grade,
    isoDate,
    dateLabel: formatViDateLabel(isoDate),
    lunarLabel: pickString(obj, [
      "lunar_date",
      "lunar_label",
      "am_lich",
      "lunar",
      "lunar_text",
      "amlich",
    ]),
    canChi: pickString(obj, [
      "can_chi",
      "can_chi_day",
      "can_chi_ngay",
      "chi_ngay",
      "day_can_chi",
      "canchi",
    ]),
    truc: pickString(obj, ["truc", "truc_star", "truc_ngay"]),
    bestHour: pickHours(obj),
    ...(bestHourSlots != null ? { bestHourSlots } : {}),
    reasons,
  };
}

/** Maps tu-tru-api chọn ngày JSON to UI rows (flexible shapes). */
export function mapChonNgayPayloadToResultDays(
  data: unknown,
  topN = 3,
): ResultDay[] {
  const arr = extractCandidateArray(data);
  const out: ResultDay[] = [];
  for (let i = 0; i < arr.length && out.length < topN; i++) {
    const row = mapOneDay(arr[i], i);
    if (row) out.push(row);
  }
  return out;
}

export function mergeReasonsIntoDays(
  days: ResultDay[],
  isoDate: string,
  reasons: string[],
): ResultDay[] {
  return days.map((d) => (d.isoDate === isoDate ? { ...d, reasons } : d));
}
