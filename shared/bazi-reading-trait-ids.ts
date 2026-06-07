/**
 * Pure helpers for §02 trait gap-fill — shared by Deno bundle + vitest.
 */

export type TraitSection = { id: string; text: string };

const TINH_CACH_TRAIT_PREFIX = "tinh_cach_trait_";
const MIN_TINH_CACH_TRAIT_LUAN_CHARS = 420;
const MIN_TINH_CACH_TRAIT_LUAN_PARAGRAPHS = 2;

const DEFAULT_TRAIT_IDS = ["diem_manh", "ca_tinh", "can_luu", "tinh_cam"];

function asRecord(x: unknown): Record<string, unknown> | null {
  if (x && typeof x === "object" && !Array.isArray(x)) {
    return x as Record<string, unknown>;
  }
  return null;
}

function pickStr(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function normalizeTraitId(id: string): string {
  return id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function splitParagraphs(text: string): string[] {
  return text
    .trim()
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function isTraitLuanDeliveryComplete(text: string): boolean {
  const t = text.trim();
  if (t.length < MIN_TINH_CACH_TRAIT_LUAN_CHARS) return false;
  return splitParagraphs(t).length >= MIN_TINH_CACH_TRAIT_LUAN_PARAGRAPHS;
}

export function parsePersonalityTraitIdsFromLaSo(lasoData: unknown): string[] {
  const root = asRecord(lasoData);
  if (!root) return [];

  const raw = root.personality_traits ?? root.personalityTraits;
  if (!Array.isArray(raw)) return [];

  const out: string[] = [];
  for (const item of raw) {
    const o = asRecord(item);
    if (!o) continue;
    const id =
      pickStr(o, ["id", "key"]) ||
      pickStr(o, ["title", "title_vi", "label_vi", "label", "name"]);
    if (id) out.push(normalizeTraitId(id));
  }
  return out;
}

export function missingTinhCachTraitIdsFromSections(
  lasoData: unknown,
  sections: TraitSection[],
): string[] {
  const fromLaSo = parsePersonalityTraitIdsFromLaSo(lasoData);
  const expected = fromLaSo.length > 0 ? fromLaSo : DEFAULT_TRAIT_IDS;

  const have = new Set<string>();
  for (const s of sections) {
    if (!s.id.startsWith(TINH_CACH_TRAIT_PREFIX)) continue;
    if (!isTraitLuanDeliveryComplete(s.text)) continue;
    have.add(normalizeTraitId(s.id.slice(TINH_CACH_TRAIT_PREFIX.length)));
  }

  return expected.filter((id) => !have.has(id));
}
