/**
 * So khớp `profiles.la_so` với body gửi Edge/API (birth_date + birth_time).
 * Tránh dùng lá số cache khi ngày/giờ sinh đã đổi mà chưa recompute.
 */

export function birthDateToIso(raw: string): string | null {
  const t = raw.trim();
  const isoHead = t.slice(0, 10);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoHead);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
  if (!dmy) return null;
  const [, d, mo, y] = dmy;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export type LaSoBirthIdentity = {
  birthDateIso: string | null;
  birthTime: number | null;
};

function parseBirthTimeCode(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    const n = Number.parseInt(raw.trim(), 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function batTuBodyBirthIdentity(
  body: Record<string, unknown>,
): LaSoBirthIdentity {
  const birthDateIso =
    typeof body.birth_date === "string"
      ? birthDateToIso(body.birth_date)
      : null;
  const birthTime = parseBirthTimeCode(body.birth_time);
  return { birthDateIso, birthTime };
}

export function laSoBirthIdentity(laSo: unknown): LaSoBirthIdentity {
  if (laSo == null || typeof laSo !== "object" || Array.isArray(laSo)) {
    return { birthDateIso: null, birthTime: null };
  }
  const o = laSo as Record<string, unknown>;
  const birthDateIso =
    typeof o.birth_date === "string" ? birthDateToIso(o.birth_date) : null;
  const birthTime = parseBirthTimeCode(o.birth_time);
  return { birthDateIso, birthTime };
}

/**
 * `true` khi payload lá số có cùng ngày (và giờ nếu request có birth_time).
 * Thiếu birth_date trên một trong hai phía → `false` (ép recompute).
 */
export function laSoMatchesBatTuBody(
  laSo: unknown,
  body: Record<string, unknown>,
): boolean {
  const stored = laSoBirthIdentity(laSo);
  const req = batTuBodyBirthIdentity(body);
  if (!stored.birthDateIso || !req.birthDateIso) return false;
  if (stored.birthDateIso !== req.birthDateIso) return false;
  if (req.birthTime != null) {
    if (stored.birthTime == null) return false;
    return stored.birthTime === req.birthTime;
  }
  return true;
}

/** Base `profile.la_so` cho merge UI — bỏ qua khi birth identity không khớp. */
export function storedLaSoForMerge(
  laSo: unknown,
  body: Record<string, unknown>,
): unknown {
  if (laSo == null) return null;
  return laSoMatchesBatTuBody(laSo, body) ? laSo : null;
}
