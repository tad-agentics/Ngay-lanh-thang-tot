/**
 * Fingerprint Tứ Trụ trong payload lá số — phát hiện cache sai cột dù birth_date khớp.
 */

const PILLAR_KEYS = ["year", "month", "day", "hour"] as const;

function asRecord(x: unknown): Record<string, unknown> | null {
  if (x && typeof x === "object" && !Array.isArray(x)) {
    return x as Record<string, unknown>;
  }
  return null;
}

function pillarCanChi(pillar: Record<string, unknown> | null): string | null {
  if (!pillar) return null;
  const can = asRecord(pillar.can);
  const chi = asRecord(pillar.chi);
  if (can?.name && chi?.name) {
    return `${String(can.name)} ${String(chi.name)}`;
  }
  if (typeof pillar.can_chi === "string" && pillar.can_chi.trim()) {
    return pillar.can_chi.trim();
  }
  return null;
}

/** Chuỗi ổn định từ `tu_tru_display` hoặc `pillars` — null nếu không đủ dữ liệu. */
export function laSoPillarFingerprint(laSo: unknown): string | null {
  const o = asRecord(laSo);
  if (!o) return null;

  const display =
    typeof o.tu_tru_display === "string" ? o.tu_tru_display.trim() : "";
  if (display) return display;

  const pillars = asRecord(o.pillars);
  if (!pillars) return null;

  const parts: string[] = [];
  for (const key of PILLAR_KEYS) {
    const cc = pillarCanChi(asRecord(pillars[key]));
    if (!cc) return null;
    parts.push(cc);
  }
  return parts.join(" | ");
}

/**
 * Hai payload lá số có cùng Tứ Trụ hiển thị.
 * Nếu chỉ một bên có fingerprint → false (tránh giữ delivery cũ thiếu pillars).
 */
export function laSoPillarsMatch(a: unknown, b: unknown): boolean {
  const fa = laSoPillarFingerprint(a);
  const fb = laSoPillarFingerprint(b);
  if (!fa && !fb) return true;
  if (!fa || !fb) return false;
  return fa === fb;
}
