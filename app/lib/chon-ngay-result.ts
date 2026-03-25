import type { ResultDay, ResultGrade } from "~/lib/api-types";

const ARRAY_KEYS = [
  "days",
  "results",
  "top_days",
  "suggested_days",
  "items",
  "ranked_days",
  "candidates",
  "recommended",
  "top",
];

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
  for (const k of ARRAY_KEYS) {
    const v = root[k];
    if (Array.isArray(v)) return v;
  }
  for (const v of Object.values(root)) {
    if (Array.isArray(v) && v.length > 0 && asRecord(v[0])) return v as unknown[];
  }
  return [];
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

function pickHours(obj: Record<string, unknown>): string {
  const keys = ["good_hours", "gio_tot", "hours_tot", "hours", "best_hours"];
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
      return (v as string[]).join(", ");
    }
  }
  return "—";
}

function gradeFromIndex(i: number): ResultGrade {
  if (i === 0) return "A";
  if (i === 1) return "B";
  return "C";
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
    if (score >= 85) grade = "A";
    else if (score >= 70) grade = "B";
    else grade = "C";
  }
  const rk = obj.rank;
  if (typeof rk === "number" && rk >= 1 && rk <= 3) {
    grade = gradeFromIndex(rk - 1);
  }

  const reasons: string[] = [];
  const r = obj.reasons ?? obj.ly_do ?? obj.giai_thich;
  if (Array.isArray(r) && r.every((x) => typeof x === "string")) {
    reasons.push(...(r as string[]));
  } else if (typeof obj.summary === "string" && obj.summary.trim()) {
    reasons.push(obj.summary.trim());
  }

  return {
    grade,
    isoDate,
    dateLabel: formatViDateLabel(isoDate),
    lunarLabel: pickString(obj, [
      "lunar_label",
      "am_lich",
      "lunar",
      "lunar_text",
      "amlich",
    ]),
    truc: pickString(obj, ["truc", "truc_star", "truc_ngay"]),
    bestHour: pickHours(obj),
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
