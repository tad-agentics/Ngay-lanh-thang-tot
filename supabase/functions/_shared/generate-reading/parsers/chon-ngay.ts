import { tryParseLaSoChiTietRecord } from "./json.ts";

const MAX_DAY_READINGS_KEYS = 8;

function normalizeDayKeyToIso(key: string): string | null {
  const t = key.trim();
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (y < 1000 || y > 9999 || mo < 1 || mo > 12 || d < 1 || d > 31) {
    return null;
  }
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== mo - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function normalizeDayReadingsRecord(
  raw: unknown,
): Record<string, string> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const iso = normalizeDayKeyToIso(k);
    if (!iso) continue;
    if (typeof v !== "string") continue;
    const t = v.trim().replace(/^\s*[-*•]\s+/gm, "").trim();
    if (!t) continue;
    const capped = t.slice(0, 12_000);
    const prev = out[iso];
    if (prev != null && prev.length >= capped.length) continue;
    out[iso] = capped;
  }
  const keys = Object.keys(out).sort();
  if (keys.length === 0) return null;
  if (keys.length <= MAX_DAY_READINGS_KEYS) return out;
  const trimmed: Record<string, string> = {};
  for (const k of keys.slice(0, MAX_DAY_READINGS_KEYS)) {
    trimmed[k] = out[k]!;
  }
  return trimmed;
}

export function parseChonNgayDayReadingsJson(
  text: string,
): Record<string, string> | null {
  const record = tryParseLaSoChiTietRecord(text);
  if (!record) return null;
  const dr = record.day_readings ?? record.dayReadings;
  return normalizeDayReadingsRecord(dr);
}
