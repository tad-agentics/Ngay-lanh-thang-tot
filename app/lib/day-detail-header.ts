function asRecord(x: unknown): Record<string, unknown> | null {
  if (x && typeof x === "object" && !Array.isArray(x)) {
    return x as Record<string, unknown>;
  }
  return null;
}

/** Prefer lunar-ish fragments first, then can chi, then hành — order matches Make subline. */
const STRING_KEYS_PRIORITY = [
  "lunar_label",
  "lunar_date",
  "lunar_text",
  "am_lich",
  "ngay_am",
  "ngay_am_lich",
  "can_chi",
  "can_chi_ngay",
  "canChi",
  "tu_hanh",
  "hanh",
] as const;

function pickStringsFromRecord(
  r: Record<string, unknown>,
  max: number,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const k of STRING_KEYS_PRIORITY) {
    const v = r[k];
    if (typeof v === "string") {
      const t = v.trim();
      if (!t) continue;
      const key = t.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(t);
      if (out.length >= max) return out;
    }
  }
  return out;
}

function mergeNested(root: Record<string, unknown>): string[] {
  const parts = pickStringsFromRecord(root, 3);
  if (parts.length >= 2) return parts;

  const nestKeys = [
    "calendar",
    "lunar",
    "lunar_info",
    "am_lich",
    "day",
    "ngay",
  ];
  for (const nk of nestKeys) {
    const inner = asRecord(root[nk]);
    if (!inner) continue;
    for (const p of pickStringsFromRecord(inner, 3)) {
      if (!parts.some((x) => x.toLowerCase() === p.toLowerCase())) {
        parts.push(p);
      }
      if (parts.length >= 3) return parts;
    }
  }
  return parts;
}

function extractSubline(data: unknown): string | null {
  const root = asRecord(data);
  if (!root) return null;
  const parts = mergeNested(root);
  if (parts.length === 0) return null;
  return parts.join(" • ");
}

export type DayDetailChip = {
  label: string;
  color: "success" | "danger" | "default";
};

export type DayDetailHeaderMeta = {
  subline: string | null;
  chip: DayDetailChip | null;
};

type DaoKind = "hoang" | "hac" | "binh";

const DAO_RECORD_KEYS = [
  "dao_type",
  "day_type",
  "loai_ngay",
  "loai_dao",
  "cat_hung",
  "hoang_hac",
  "ngay_cat_hung",
] as const;

function normalizedAsciiLower(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function daoKindFromString(v: string): DaoKind | null {
  const raw = v.trim();
  if (!raw) return null;
  const lc = raw.toLowerCase();
  if (lc.includes("hắc") && lc.includes("đạo")) return "hac";
  if (lc.includes("hoàng") && lc.includes("đạo")) return "hoang";

  const n = normalizedAsciiLower(raw);
  if (!n) return null;

  if (
    n.includes("hoang dao") ||
    n.includes("hoang-dao") ||
    n.includes("hoang_dao") ||
    n.includes("hoangdao")
  ) {
    return "hoang";
  }
  if (
    n.includes("hac dao") ||
    n.includes("hac-dao") ||
    n.includes("hac_dao") ||
    n.includes("hacdao")
  ) {
    return "hac";
  }

  if (
    n.includes("binh thuong") ||
    n.includes("binh-thuong") ||
    n.includes("neutral") ||
    n === "thuong" ||
    n.includes("mac dinh")
  ) {
    return "binh";
  }

  if (n.includes("hoang") && n.includes("cat")) return "hoang";
  if (n.includes("hac") && n.includes("hung")) return "hac";

  return null;
}

function daoKindFromUnknown(v: unknown): DaoKind | null {
  if (typeof v === "number") {
    if (v === 1) return "hoang";
    if (v === -1) return "hac";
    if (v === 0) return "binh";
  }
  if (typeof v === "string") return daoKindFromString(v);
  return null;
}

function extractDaoStructuredRecord(r: Record<string, unknown>): DaoKind | null {
  if (r.is_hoang_dao === true || r.hoang_dao === true) return "hoang";
  if (r.is_hac_dao === true || r.hac_dao === true) return "hac";

  for (const k of DAO_RECORD_KEYS) {
    const hit = daoKindFromUnknown(r[k]);
    if (hit) return hit;
  }
  return null;
}

function extractDaoStructured(data: unknown): DaoKind | null {
  const root = asRecord(data);
  if (!root) return null;
  const hit = extractDaoStructuredRecord(root);
  if (hit) return hit;
  for (const nk of ["day", "ngay", "calendar", "lunar", "lunar_info"]) {
    const inner = asRecord(root[nk]);
    if (!inner) continue;
    const h = extractDaoStructuredRecord(inner);
    if (h) return h;
  }
  return null;
}

function detectDaoFromFreeText(s: string): DaoKind | null {
  const hit = daoKindFromString(s);
  if (hit === "hoang" || hit === "hac") return hit;
  const n = normalizedAsciiLower(s);
  if (/\bhoang\s*dao\b/.test(n) || /ngay\s*hoang/.test(n)) return "hoang";
  if (/\bhac\s*dao\b/.test(n) || /ngay\s*hac\b/.test(n)) return "hac";
  return null;
}

/** Heuristic: scan string values (shallow tree) for Hoàng/Hắc đạo mentions. */
function findDaoKindInPayload(data: unknown, maxDepth: number): DaoKind | null {
  let hoang = false;
  let hac = false;
  function visit(x: unknown, d: number): void {
    if (d < 0) return;
    if (typeof x === "string") {
      const k = detectDaoFromFreeText(x);
      if (k === "hoang") hoang = true;
      if (k === "hac") hac = true;
      return;
    }
    if (Array.isArray(x)) {
      for (const el of x) visit(el, d - 1);
      return;
    }
    const o = asRecord(x);
    if (!o) return;
    for (const v of Object.values(o)) visit(v, d - 1);
  }
  visit(data, maxDepth);
  if (hoang && hac) return "hoang";
  if (hoang) return "hoang";
  if (hac) return "hac";
  return null;
}

function daoKindToChip(kind: DaoKind | null): DayDetailChip | null {
  if (kind === "hoang")
    return { label: "Hoàng Đạo", color: "success" };
  if (kind === "hac") return { label: "Hắc Đạo", color: "danger" };
  if (kind === "binh")
    return { label: "Bình thường", color: "default" };
  return null;
}

/** Subline + Hoàng/Hắc/Bình chip from `day-detail` JSON (structured fields + light text scan). */
export function extractDayDetailHeaderMeta(data: unknown): DayDetailHeaderMeta {
  const subline = extractSubline(data);
  const structured = extractDaoStructured(data);
  const fromText =
    structured === null ? findDaoKindInPayload(data, 3) : null;
  const kind = structured ?? fromText;
  let chip = daoKindToChip(kind);
  if (!chip && subline) {
    chip = { label: "Bình thường", color: "default" };
  }
  return { subline, chip };
}

export function extractDayDetailHeaderSubline(data: unknown): string | null {
  return extractDayDetailHeaderMeta(data).subline;
}
