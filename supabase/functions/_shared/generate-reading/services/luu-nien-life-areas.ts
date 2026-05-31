import {
  LA_SO_CHI_TIET_TIMEOUT_MS,
  READING_MAX_TOKENS_LUU_NIEN_LIFE_AREAS,
  READING_MAX_TOKENS_LUU_NIEN_LIFE_AREAS_BATCH,
} from "../core/config.ts";
import type { EdgeBudget } from "../core/edge-budget.ts";
import { llmLaSoChiTietJson } from "../core/llm.ts";
import type { LaSoChiTietSection } from "../core/types.ts";
import {
  LUU_NIEN_LIFE_AREA_PREFIX,
  luuNienLifeAreaProseTooShort,
  luuNienLifeAreasToSections,
  parseLuuNienLifeAreasResponse,
  type LuuNienLifeAreasPayload,
} from "../parsers/luu-nien-life.ts";
import {
  luuNienLifeAreasRetrySystem,
  luuNienLifeAreasSystem,
} from "../prompts/luu-nien-life.ts";
import {
  lifeAreaIdsFromPayload,
  payloadForLifeBatch,
  splitIdsForParallelBatches,
} from "./reading-subset-batch.ts";

const JSON_ROUND_MIN_MS = 12_000;
const PARALLEL_BATCH_MIN_MS = 14_000;

function callTimeout(budget: EdgeBudget): number {
  return budget.callTimeout(LA_SO_CHI_TIET_TIMEOUT_MS);
}

function maxTokensForAreaCount(count: number): number {
  return count <= 2
    ? READING_MAX_TOKENS_LUU_NIEN_LIFE_AREAS_BATCH
    : READING_MAX_TOKENS_LUU_NIEN_LIFE_AREAS;
}

function bareAreaId(sectionId: string): string {
  return sectionId.startsWith(LUU_NIEN_LIFE_AREA_PREFIX)
    ? sectionId.slice(LUU_NIEN_LIFE_AREA_PREFIX.length)
    : sectionId;
}

export function filterLifePayloadToIds(
  parsed: LuuNienLifeAreasPayload | null,
  areaIds: string[],
): LuuNienLifeAreasPayload | null {
  if (!parsed) return null;
  const want = new Set(areaIds.map((id) => id.toLowerCase()));
  const areas = parsed.areas.filter((a) =>
    want.has(bareAreaId(a.id).toLowerCase())
  );
  if (!parsed.yearIntro && areas.length === 0) return null;
  return { yearIntro: parsed.yearIntro, areas };
}

export function mergeLifePayloads(
  a: LuuNienLifeAreasPayload | null,
  b: LuuNienLifeAreasPayload | null,
): LuuNienLifeAreasPayload | null {
  if (!a && !b) return null;
  const byId = new Map<string, LaSoChiTietSection>();
  for (const s of [...(a?.areas ?? []), ...(b?.areas ?? [])]) {
    byId.set(s.id, s);
  }
  const areas = [...byId.values()];
  const yearIntro = a?.yearIntro?.trim() || b?.yearIntro?.trim() || null;
  if (!yearIntro && areas.length === 0) return null;
  return { yearIntro, areas };
}

function parseLifeLlmRaw(
  raw: string,
  areaIds: string[],
): LuuNienLifeAreasPayload | null {
  let parsed = parseLuuNienLifeAreasResponse(raw);
  parsed = filterLifePayloadToIds(parsed, areaIds);
  if (!parsed?.areas.length) {
    const relaxed = filterLifePayloadToIds(
      parseLuuNienLifeAreasResponse(raw, { relaxed: true }),
      areaIds,
    );
    if (relaxed?.areas.length) parsed = relaxed;
  }
  return parsed;
}

async function generateLuuNienLifeBatchFirstPass(
  payload: string,
  areaIds: string[],
  includeIntro: boolean,
  budget: EdgeBudget,
): Promise<LuuNienLifeAreasPayload | null> {
  if (areaIds.length === 0) return null;
  const opts = { areaIds, includeIntro };
  const system = luuNienLifeAreasSystem(opts);
  const batchPayload = payloadForLifeBatch(payload, areaIds, includeIntro);
  const maxTokens = maxTokensForAreaCount(areaIds.length);

  const raw = await llmLaSoChiTietJson(system, batchPayload, maxTokens, {
    timeoutMs: callTimeout(budget),
    disableThinking: true,
  });
  if (!raw) return null;
  return parseLifeLlmRaw(raw, areaIds);
}

async function generateLuuNienLifeBatchWithRetry(
  payload: string,
  areaIds: string[],
  includeIntro: boolean,
  budget: EdgeBudget,
): Promise<LuuNienLifeAreasPayload | null> {
  let parsed = await generateLuuNienLifeBatchFirstPass(
    payload,
    areaIds,
    includeIntro,
    budget,
  );
  if (parsed?.areas.length) return parsed;
  if (!budget.canSpend(JSON_ROUND_MIN_MS)) return parsed;

  const opts = { areaIds, includeIntro };
  const batchPayload = payloadForLifeBatch(payload, areaIds, includeIntro);
  const maxTokens = maxTokensForAreaCount(areaIds.length);
  const retry = await llmLaSoChiTietJson(
    luuNienLifeAreasRetrySystem(opts),
    batchPayload,
    maxTokens,
    { timeoutMs: callTimeout(budget), disableThinking: true },
  );
  if (!retry) return parsed;
  return parseLifeLlmRaw(retry, areaIds) ?? parsed;
}

function areaIdsStillMissing(
  merged: LuuNienLifeAreasPayload | null,
  wantIds: string[],
): string[] {
  const have = new Set(
    (merged?.areas ?? []).map((a) => bareAreaId(a.id).toLowerCase()),
  );
  return wantIds.filter((id) => !have.has(id.toLowerCase()));
}

async function generateLuuNienLifeAreaSectionsScoped(
  payload: string,
  areaIds: string[],
  includeIntro: boolean,
  budget: EdgeBudget,
): Promise<LaSoChiTietSection[]> {
  if (areaIds.length === 0) return [];
  let parsed = await generateLuuNienLifeBatchWithRetry(
    payload,
    areaIds,
    includeIntro,
    budget,
  );

  if (
    parsed?.areas.length &&
    budget.canSpend(JSON_ROUND_MIN_MS) &&
    parsed.areas.some((s) => luuNienLifeAreaProseTooShort(s.text))
  ) {
    const lengthRetry = await llmLaSoChiTietJson(
      luuNienLifeAreasRetrySystem({ areaIds, includeIntro }),
      payloadForLifeBatch(payload, areaIds, includeIntro),
      maxTokensForAreaCount(areaIds.length),
      { timeoutMs: callTimeout(budget), disableThinking: true },
    );
    if (lengthRetry) {
      const expanded = filterLifePayloadToIds(
        parseLuuNienLifeAreasResponse(lengthRetry),
        areaIds,
      );
      if (expanded?.areas.length) parsed = expanded;
    }
  }

  if (!parsed) return [];
  return luuNienLifeAreasToSections(parsed);
}

/** §03 — luận ~500 chữ / 3 đoạn / lĩnh vực vận năm. */
export async function generateLuuNienLifeAreaSections(
  payload: string,
  budget: EdgeBudget,
): Promise<LaSoChiTietSection[]> {
  if (!budget.canSpend(JSON_ROUND_MIN_MS)) return [];

  const allIds = lifeAreaIdsFromPayload(payload);
  const [batchA, batchB] = splitIdsForParallelBatches(allIds);

  if (
    batchB.length > 0 &&
    budget.canSpend(PARALLEL_BATCH_MIN_MS * 2)
  ) {
    const [r1, r2] = await Promise.all([
      generateLuuNienLifeBatchFirstPass(payload, batchA, true, budget),
      generateLuuNienLifeBatchFirstPass(payload, batchB, false, budget),
    ]);
    let merged = mergeLifePayloads(
      filterLifePayloadToIds(r1, batchA),
      filterLifePayloadToIds(r2, batchB),
    );

    const missingA = areaIdsStillMissing(merged, batchA);
    if (missingA.length > 0 && budget.canSpend(JSON_ROUND_MIN_MS)) {
      const retryA = await generateLuuNienLifeBatchWithRetry(
        payload,
        missingA,
        true,
        budget,
      );
      merged = mergeLifePayloads(
        merged,
        filterLifePayloadToIds(retryA, missingA),
      );
    }

    const missingB = areaIdsStillMissing(merged, batchB);
    if (missingB.length > 0 && budget.canSpend(JSON_ROUND_MIN_MS)) {
      const retryB = await generateLuuNienLifeBatchWithRetry(
        payload,
        missingB,
        false,
        budget,
      );
      merged = mergeLifePayloads(
        merged,
        filterLifePayloadToIds(retryB, missingB),
      );
    }

    if (merged && (merged.yearIntro || merged.areas.length > 0)) {
      const sections = luuNienLifeAreasToSections(merged);
      if (sections.length > 0) return sections;
    }
  }

  const scoped = await generateLuuNienLifeAreaSectionsScoped(
    payload,
    allIds,
    true,
    budget,
  );
  if (scoped.length > 0) return scoped;

  console.warn(
    "[luận-giải] luu-nien life_areas: parallel + scoped đều rỗng",
    budget.elapsed(),
  );
  return [];
}
