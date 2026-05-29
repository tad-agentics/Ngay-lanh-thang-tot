import type { SavedPick } from "~/hooks/useSavedPicks";

export function pickScoreNumber(score: SavedPick["score"]): number | null {
  if (typeof score === "number" && Number.isFinite(score)) return Math.round(score);
  if (typeof score === "string" && score.trim()) {
    const n = Number.parseFloat(score);
    if (Number.isFinite(n)) return Math.round(n);
  }
  return null;
}

export function daysUntilIso(iso: string | null, now = new Date()): string | null {
  if (!iso) return null;
  const target = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const anchor = new Date(now);
  anchor.setHours(12, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - anchor.getTime()) / 86_400_000);
  if (diff < 0) return null;
  if (diff === 0) return "hôm nay";
  if (diff < 30) return `${diff} ngày nữa`;
  if (diff < 60) return "~1 tháng";
  return `~${Math.round(diff / 30)} tháng`;
}

export function formatPickDateDot(iso: string): string {
  const dt = new Date(`${iso.slice(0, 10)}T12:00:00`);
  const d = String(dt.getDate()).padStart(2, "0");
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  return `${d}.${m}`;
}

export type UpcomingSavedPickRow = {
  id: string;
  iso: string;
  d: string;
  v: string;
  note: string | null;
  intent: string | null;
  s: number;
  in: string;
};

/** Upcoming marked days for `/toi` preview — soonest first, max `limit`. */
export function upcomingSavedPicks(
  picks: SavedPick[],
  options?: { now?: Date; limit?: number },
): UpcomingSavedPickRow[] {
  const now = options?.now ?? new Date();
  const limit = options?.limit ?? 3;

  return picks
    .filter((p) => p.day_iso && daysUntilIso(p.day_iso, now))
    .sort(
      (a, b) =>
        new Date(`${a.day_iso!}T12:00:00`).getTime() -
        new Date(`${b.day_iso!}T12:00:00`).getTime(),
    )
    .slice(0, limit)
    .map((p) => ({
      id: p.id,
      iso: p.day_iso!,
      d: formatPickDateDot(p.day_iso!),
      v: p.label ?? "Ngày đã đánh dấu",
      note: p.note?.trim() || null,
      intent: p.intent?.trim() || null,
      s: pickScoreNumber(p.score) ?? 78,
      in: daysUntilIso(p.day_iso, now)!,
    }));
}

export function findSavedPickForDay(
  picks: SavedPick[],
  dayIso: string,
): SavedPick | undefined {
  return picks.find((p) => p.day_iso === dayIso);
}
