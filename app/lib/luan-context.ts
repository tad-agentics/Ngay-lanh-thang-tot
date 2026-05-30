/** Parse `/luan-ai/:context` route param (e.g. `day-2026-05-26`, `bazi-year`, `tieu-van-2026`). */

export type LuanDayContext = {
  kind: "day";
  iso: string;
};

export type LuanBaziContext = {
  kind: "bazi-year";
};

export type LuanTieuVanContext = {
  kind: "tieu-van";
  year: number;
};

export type LuanContext =
  | LuanDayContext
  | LuanBaziContext
  | LuanTieuVanContext
  | { kind: "invalid" };

const DAY_PREFIX = "day-";
const TIEU_VAN_PREFIX = "tieu-van-";

export function parseLuanContext(raw: string | undefined): LuanContext {
  if (!raw) return { kind: "invalid" };

  if (raw === "bazi-year") {
    return { kind: "bazi-year" };
  }

  if (raw.startsWith(TIEU_VAN_PREFIX)) {
    const year = Number.parseInt(raw.slice(TIEU_VAN_PREFIX.length), 10);
    if (Number.isFinite(year) && year >= 1900 && year <= 2100) {
      return { kind: "tieu-van", year };
    }
    return { kind: "invalid" };
  }

  if (!raw.startsWith(DAY_PREFIX)) {
    return { kind: "invalid" };
  }
  const iso = raw.slice(DAY_PREFIX.length);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return { kind: "invalid" };
  }
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) {
    return { kind: "invalid" };
  }
  return { kind: "day", iso };
}

export function luanContextToParam(iso: string): string {
  return `${DAY_PREFIX}${iso}`;
}

export function luanTieuVanContextToParam(year: number): string {
  return `${TIEU_VAN_PREFIX}${year}`;
}

/** True when payload is upstream `LuanContextResponse` (not raw day-detail). */
export function isLuanContextPayload(data: unknown): boolean {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const d = data as Record<string, unknown>;
  return (
    Array.isArray(d.breakdown_summary) &&
    typeof d.date_iso === "string" &&
    d.date_iso.trim().length > 0
  );
}

export type DayCompareFacts = {
  comparisonVi: string;
  deltaScore: number;
  scoreA: number;
  scoreB: number;
  betterFor: string[];
};

export function parseDayCompareResponse(raw: unknown): DayCompareFacts | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const d = raw as Record<string, unknown>;
  const comparisonVi =
    typeof d.comparison_vi === "string" ? d.comparison_vi.trim() : "";
  if (!comparisonVi) return null;
  const deltaScore =
    typeof d.delta_score === "number" && Number.isFinite(d.delta_score)
      ? d.delta_score
      : 0;
  const scoreA =
    typeof d.score_a === "number" && Number.isFinite(d.score_a) ? d.score_a : 0;
  const scoreB =
    typeof d.score_b === "number" && Number.isFinite(d.score_b) ? d.score_b : 0;
  const betterFor: string[] = [];
  const bf = d.better_for ?? d.betterFor;
  if (Array.isArray(bf)) {
    for (const x of bf) {
      if (typeof x === "string" && x.trim()) betterFor.push(x.trim());
    }
  }
  return { comparisonVi, deltaScore, scoreA, scoreB, betterFor };
}
