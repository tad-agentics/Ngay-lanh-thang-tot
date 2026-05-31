import { stableStringify } from "../core/cache.ts";
import { LA_SO_DEFAULT_TRAIT_IDS } from "../prompts/la-so.ts";
import { LUU_NIEN_DEFAULT_LIFE_AREA_IDS } from "../prompts/luu-nien-life.ts";

export function traitIdsFromPayload(payload: string): string[] {
  try {
    const root = JSON.parse(payload) as Record<string, unknown>;
    const filter = root.tinh_cach_trait_ids ?? root.tinhCachTraitIds;
    if (Array.isArray(filter) && filter.length > 0) {
      return filter
        .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
        .map((x) => x.trim().toLowerCase());
    }
    const data = root.data;
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const d = data as Record<string, unknown>;
      const raw = d.personality_traits ?? d.personalityTraits;
      if (Array.isArray(raw)) {
        const ids: string[] = [];
        for (const row of raw) {
          if (!row || typeof row !== "object" || Array.isArray(row)) continue;
          const id = (row as Record<string, unknown>).id;
          if (typeof id === "string" && id.trim()) ids.push(id.trim().toLowerCase());
        }
        if (ids.length > 0) return ids;
      }
    }
  } catch {
    /* fall through */
  }
  return [...LA_SO_DEFAULT_TRAIT_IDS];
}

export function lifeAreaIdsFromPayload(payload: string): string[] {
  try {
    const root = JSON.parse(payload) as Record<string, unknown>;
    const filter = root.luu_nien_life_area_ids ?? root.luuNienLifeAreaIds;
    if (Array.isArray(filter) && filter.length > 0) {
      return filter
        .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
        .map((x) => x.trim().toLowerCase());
    }
    const data = root.data;
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const d = data as Record<string, unknown>;
      const raw = d.life_areas ?? d.lifeAreas;
      if (Array.isArray(raw)) {
        const ids: string[] = [];
        for (const row of raw) {
          if (!row || typeof row !== "object" || Array.isArray(row)) continue;
          const id = (row as Record<string, unknown>).id;
          if (typeof id === "string" && id.trim()) ids.push(id.trim().toLowerCase());
        }
        if (ids.length > 0) return ids;
      }
    }
  } catch {
    /* fall through */
  }
  return [...LUU_NIEN_DEFAULT_LIFE_AREA_IDS];
}

export function splitIdsForParallelBatches(ids: string[]): [string[], string[]] {
  if (ids.length <= 1) return [ids, []];
  const mid = Math.ceil(ids.length / 2);
  return [ids.slice(0, mid), ids.slice(mid)];
}

export function payloadForTraitBatch(
  payload: string,
  traitIds: string[],
  includeIntro: boolean,
): string {
  try {
    const root = JSON.parse(payload) as Record<string, unknown>;
    return stableStringify({
      ...root,
      tinh_cach_batch: { trait_ids: traitIds, include_intro: includeIntro },
    });
  } catch {
    return payload;
  }
}

export function payloadForLifeBatch(
  payload: string,
  areaIds: string[],
  includeIntro: boolean,
): string {
  try {
    const root = JSON.parse(payload) as Record<string, unknown>;
    return stableStringify({
      ...root,
      luu_nien_life_batch: { area_ids: areaIds, include_intro: includeIntro },
    });
  } catch {
    return payload;
  }
}
