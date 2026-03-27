/**
 * Trích các khối đọc được từ JSON GET /v1/la-so (sau khi lột envelope) để hiển thị UI
 * song song với luận giải — không lặp tứ trụ đã có từ tu-tru trong DB.
 */

export type LaSoStructuredSection = {
  id: string;
  title: string;
  lines: string[];
};

const SECTION_DEF: { id: string; keys: string[]; title: string }[] = [
  { id: "tinh_cach", keys: ["tinh_cach", "tinhCach"], title: "Tính cách" },
  { id: "su_nghiep", keys: ["su_nghiep", "suNghiep"], title: "Sự nghiệp" },
  { id: "tai_van", keys: ["tai_van", "taiVan"], title: "Tài vận" },
  { id: "suc_khoe", keys: ["suc_khoe", "sucKhoe"], title: "Sức khỏe" },
  { id: "tinh_duyen", keys: ["tinh_duyen", "tinhDuyen"], title: "Tình duyên" },
];

function asRecord(x: unknown): Record<string, unknown> | null {
  if (x && typeof x === "object" && !Array.isArray(x)) {
    return x as Record<string, unknown>;
  }
  return null;
}

const TEXT_KEYS = [
  "summary",
  "text",
  "content",
  "overview",
  "description",
  "label",
  "title",
  "value",
  "nhan_xet",
  "nhanXet",
] as const;

const LIST_KEYS = ["points", "items", "highlights", "traits", "notes"] as const;

function dedupeLines(lines: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const l of lines) {
    const t = l.trim();
    if (t.length === 0 || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/** Chuyển giá trị API (string | object | mảng) thành các dòng hiển thị. */
export function valueToDisplayLines(v: unknown, depth = 0): string[] {
  if (depth > 8) return [];
  if (v == null) return [];
  if (typeof v === "string") {
    const t = v.trim();
    return t ? [t] : [];
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return [String(v)];
  }
  if (Array.isArray(v)) {
    return dedupeLines(
      v.flatMap((item) => valueToDisplayLines(item, depth + 1)),
    );
  }
  const o = asRecord(v);
  if (!o) return [];

  for (const k of TEXT_KEYS) {
    const s = o[k];
    if (typeof s === "string" && s.trim()) return [s.trim()];
  }

  for (const k of LIST_KEYS) {
    const arr = o[k];
    if (Array.isArray(arr)) {
      const lines = valueToDisplayLines(arr, depth + 1);
      if (lines.length) return lines;
    }
  }

  const nested: string[] = [];
  for (const [k, val] of Object.entries(o)) {
    if (k.startsWith("_")) continue;
    if (val == null) continue;
    if (typeof val === "string" && val.trim()) nested.push(val.trim());
    else if (typeof val === "object") {
      nested.push(...valueToDisplayLines(val, depth + 1));
    }
  }
  return dedupeLines(nested);
}

/**
 * Đọc các khối semantic lá số từ payload (cùng object gửi generate-reading).
 */
export function extractLaSoStructuredSections(
  payload: unknown,
): LaSoStructuredSection[] {
  const o = asRecord(payload);
  if (!o) return [];

  const inner =
    asRecord(o.data) ?? asRecord(o.result) ?? asRecord(o.payload) ?? o;

  const out: LaSoStructuredSection[] = [];
  for (const def of SECTION_DEF) {
    for (const key of def.keys) {
      if (!(key in inner)) continue;
      const lines = valueToDisplayLines(inner[key]);
      if (lines.length > 0) {
        out.push({ id: def.id, title: def.title, lines });
      }
      break;
    }
  }
  return out;
}
