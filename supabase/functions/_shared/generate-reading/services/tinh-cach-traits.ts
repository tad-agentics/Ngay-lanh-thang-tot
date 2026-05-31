import {
  LA_SO_CHI_TIET_TIMEOUT_MS,
  READING_MAX_TOKENS_TINH_CACH_TRAITS,
  READING_MAX_TOKENS_TINH_CACH_TRAITS_BATCH,
} from "../core/config.ts";
import type { EdgeBudget } from "../core/edge-budget.ts";
import { llmLaSoChiTietJson } from "../core/llm.ts";
import type { LaSoChiTietSection } from "../core/types.ts";
import {
  parseTinhCachTraitsResponse,
  TINH_CACH_TRAIT_SECTION_PREFIX,
  type TinhCachTraitsPayload,
  tinhCachTraitsToLaSoSections,
} from "../parsers/la-so.ts";
import {
  laSoTinhCachTraitsRetrySystem,
  laSoTinhCachTraitsSystem,
} from "../prompts/la-so.ts";
import {
  payloadForTraitBatch,
  splitIdsForParallelBatches,
  traitIdsFromPayload,
} from "./reading-subset-batch.ts";

const JSON_ROUND_MIN_MS = 12_000;
const PARALLEL_BATCH_MIN_MS = 14_000;

function callTimeout(budget: EdgeBudget): number {
  return budget.callTimeout(LA_SO_CHI_TIET_TIMEOUT_MS);
}

function maxTokensForTraitCount(count: number): number {
  return count <= 2
    ? READING_MAX_TOKENS_TINH_CACH_TRAITS_BATCH
    : READING_MAX_TOKENS_TINH_CACH_TRAITS;
}

function bareTraitId(sectionId: string): string {
  return sectionId.startsWith(TINH_CACH_TRAIT_SECTION_PREFIX)
    ? sectionId.slice(TINH_CACH_TRAIT_SECTION_PREFIX.length)
    : sectionId;
}

/** Chỉ giữ traits thuộc lô (model đôi khi trả thừa id). */
export function filterTraitPayloadToIds(
  parsed: TinhCachTraitsPayload | null,
  traitIds: string[],
): TinhCachTraitsPayload | null {
  if (!parsed) return null;
  const want = new Set(traitIds.map((id) => id.toLowerCase()));
  const traits = parsed.traits.filter((t) =>
    want.has(bareTraitId(t.id).toLowerCase())
  );
  if (!parsed.intro && traits.length === 0) return null;
  return { intro: parsed.intro, traits };
}

export function mergeTraitPayloads(
  a: TinhCachTraitsPayload | null,
  b: TinhCachTraitsPayload | null,
): TinhCachTraitsPayload | null {
  if (!a && !b) return null;
  const byId = new Map<string, LaSoChiTietSection>();
  for (const t of [...(a?.traits ?? []), ...(b?.traits ?? [])]) {
    byId.set(t.id, t);
  }
  const traits = [...byId.values()];
  const intro = a?.intro?.trim() || b?.intro?.trim() || null;
  if (!intro && traits.length === 0) return null;
  return { intro, traits };
}

function parseTraitLlmRaw(
  raw: string,
  traitIds: string[],
): TinhCachTraitsPayload | null {
  let parsed = parseTinhCachTraitsResponse(raw);
  parsed = filterTraitPayloadToIds(parsed, traitIds);
  if (!parsed?.traits.length) {
    const relaxed = filterTraitPayloadToIds(
      parseTinhCachTraitsResponse(raw, { relaxed: true }),
      traitIds,
    );
    if (relaxed?.traits.length) parsed = relaxed;
  }
  return parsed;
}

/** Lần gọi đầu — không retry (tránh 4 LLM song song trong 52s). */
async function generateTinhCachTraitBatchFirstPass(
  payload: string,
  traitIds: string[],
  includeIntro: boolean,
  budget: EdgeBudget,
): Promise<TinhCachTraitsPayload | null> {
  if (traitIds.length === 0) return null;
  const opts = { traitIds, includeIntro };
  const system = laSoTinhCachTraitsSystem(opts);
  const batchPayload = payloadForTraitBatch(payload, traitIds, includeIntro);
  const maxTokens = maxTokensForTraitCount(traitIds.length);

  const raw = await llmLaSoChiTietJson(system, batchPayload, maxTokens, {
    timeoutMs: callTimeout(budget),
    disableThinking: true,
  });
  if (!raw) return null;
  return parseTraitLlmRaw(raw, traitIds);
}

/** Retry tuần tự — prompt scoped đúng số mục. */
async function generateTinhCachTraitBatchWithRetry(
  payload: string,
  traitIds: string[],
  includeIntro: boolean,
  budget: EdgeBudget,
): Promise<TinhCachTraitsPayload | null> {
  let parsed = await generateTinhCachTraitBatchFirstPass(
    payload,
    traitIds,
    includeIntro,
    budget,
  );
  if (parsed?.traits.length) return parsed;
  if (!budget.canSpend(JSON_ROUND_MIN_MS)) return parsed;

  const opts = { traitIds, includeIntro };
  const batchPayload = payloadForTraitBatch(payload, traitIds, includeIntro);
  const maxTokens = maxTokensForTraitCount(traitIds.length);
  const retry = await llmLaSoChiTietJson(
    laSoTinhCachTraitsRetrySystem(opts),
    batchPayload,
    maxTokens,
    { timeoutMs: callTimeout(budget), disableThinking: true },
  );
  if (!retry) return parsed;
  return parseTraitLlmRaw(retry, traitIds) ?? parsed;
}

function traitIdsStillMissing(
  merged: TinhCachTraitsPayload | null,
  wantIds: string[],
): string[] {
  const have = new Set(
    (merged?.traits ?? []).map((t) => bareTraitId(t.id).toLowerCase()),
  );
  return wantIds.filter((id) => !have.has(id.toLowerCase()));
}

/** Sinh scoped theo danh sách id (1–4 mục, có/không intro). */
async function generateTinhCachTraitSectionsScoped(
  payload: string,
  traitIds: string[],
  includeIntro: boolean,
  budget: EdgeBudget,
): Promise<LaSoChiTietSection[]> {
  if (traitIds.length === 0) return [];
  const parsed = await generateTinhCachTraitBatchWithRetry(
    payload,
    traitIds,
    includeIntro,
    budget,
  );
  if (!parsed) return [];
  return tinhCachTraitsToLaSoSections(parsed);
}

/** §02 — luận dài từng personality_readings (500–600 từ / mục). */
export async function generateTinhCachTraitSections(
  payload: string,
  budget: EdgeBudget,
): Promise<LaSoChiTietSection[]> {
  if (!budget.canSpend(JSON_ROUND_MIN_MS)) return [];

  const allIds = traitIdsFromPayload(payload);
  const [batchA, batchB] = splitIdsForParallelBatches(allIds);

  if (
    batchB.length > 0 &&
    budget.canSpend(PARALLEL_BATCH_MIN_MS * 2)
  ) {
    const [r1, r2] = await Promise.all([
      generateTinhCachTraitBatchFirstPass(payload, batchA, true, budget),
      generateTinhCachTraitBatchFirstPass(payload, batchB, false, budget),
    ]);
    let merged = mergeTraitPayloads(
      filterTraitPayloadToIds(r1, batchA),
      filterTraitPayloadToIds(r2, batchB),
    );

    const missingA = traitIdsStillMissing(merged, batchA);
    if (missingA.length > 0 && budget.canSpend(JSON_ROUND_MIN_MS)) {
      const retryA = await generateTinhCachTraitBatchWithRetry(
        payload,
        missingA,
        true,
        budget,
      );
      merged = mergeTraitPayloads(
        merged,
        filterTraitPayloadToIds(retryA, missingA),
      );
    }

    const missingB = traitIdsStillMissing(merged, batchB);
    if (missingB.length > 0 && budget.canSpend(JSON_ROUND_MIN_MS)) {
      const retryB = await generateTinhCachTraitBatchWithRetry(
        payload,
        missingB,
        false,
        budget,
      );
      merged = mergeTraitPayloads(
        merged,
        filterTraitPayloadToIds(retryB, missingB),
      );
    }

    if (merged && (merged.intro || merged.traits.length > 0)) {
      const sections = tinhCachTraitsToLaSoSections(merged);
      if (sections.length > 0) return sections;
    }
  }

  const scoped = await generateTinhCachTraitSectionsScoped(
    payload,
    allIds,
    true,
    budget,
  );
  if (scoped.length > 0) return scoped;

  console.warn(
    "[luận-giải] tinh-cach-traits: parallel + scoped đều rỗng",
    budget.elapsed(),
  );
  return [];
}
