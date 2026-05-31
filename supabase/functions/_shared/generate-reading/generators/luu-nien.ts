import {
  LUU_NIEN_JSON_TIMEOUT_MS,
  LUU_NIEN_TIMEOUT_MS,
  READING_MAX_TOKENS_LUU_NIEN,
  READING_MAX_TOKENS_LUU_NIEN_JSON,
  ttlForEndpoint,
} from "../core/config.ts";
import {
  createEdgeBudget,
  GENERATE_READING_EDGE_BUDGET_MS,
  TIEU_VAN_JSON_CALL_TIMEOUT_MS,
  TIEU_VAN_PROSE_CALL_TIMEOUT_MS,
} from "../core/edge-budget.ts";
import { llmCompletion, llmLegacyProse } from "../core/llm.ts";
import { llmProfileForEndpoint } from "../core/llm-profiles.ts";
import { stableStringify } from "../core/cache.ts";
import type { GenerateContext, GenerateResult } from "../core/types.ts";
import type { LaSoChiTietSection } from "../core/types.ts";
import {
  LUU_NIEN_CORE_SECTION_ORDER,
  luuNienCoreSectionsNeedLengthRetry,
  parseLuuNienCoreSections,
} from "../parsers/luu-nien-core.ts";
import { SYSTEM_PROMPT } from "../prompts/legacy-prose.ts";
import {
  LUU_NIEN_CORE_JSON_LENGTH_RETRY,
  LUU_NIEN_CORE_JSON_RETRY,
  LUU_NIEN_CORE_JSON_SYSTEM,
} from "../prompts/luu-nien-core.ts";
import { generateLuuNienLifeAreaSections } from "../services/luu-nien-life-areas.ts";

const JSON_ROUND_MIN_MS = 10_000;
const LENGTH_ROUND_MIN_MS = 10_000;
const PROSE_ROUND_MIN_MS = 8_000;

async function generateLuuNienCoreSections(
  ctx: GenerateContext,
  budget: ReturnType<typeof createEdgeBudget>,
): Promise<LaSoChiTietSection[] | null> {
  const { payload, data } = ctx;
  const profile = llmProfileForEndpoint("luu-nien");
  const llmOpts = {
    profile,
    jsonMode: true as const,
    disableThinking: true,
  };

  const jsonTimeout = () =>
    budget.callTimeout(
      Math.min(TIEU_VAN_JSON_CALL_TIMEOUT_MS, LUU_NIEN_JSON_TIMEOUT_MS),
    );

  if (!budget.canSpend(JSON_ROUND_MIN_MS)) return null;

  const rawJson = await llmCompletion(
    LUU_NIEN_CORE_JSON_SYSTEM,
    payload,
    READING_MAX_TOKENS_LUU_NIEN_JSON,
    jsonTimeout(),
    llmOpts,
  );
  let sections = rawJson ? parseLuuNienCoreSections(rawJson) : null;

  if (!sections?.length && budget.canSpend(JSON_ROUND_MIN_MS)) {
    const retry = await llmCompletion(
      LUU_NIEN_CORE_JSON_RETRY,
      payload,
      READING_MAX_TOKENS_LUU_NIEN_JSON,
      jsonTimeout(),
      llmOpts,
    );
    sections = retry ? parseLuuNienCoreSections(retry) : null;
  }

  if (
    sections?.length &&
    luuNienCoreSectionsNeedLengthRetry(sections) &&
    budget.canSpend(LENGTH_ROUND_MIN_MS)
  ) {
    const lengthUser = stableStringify({
      endpoint: "luu-nien",
      data,
      previous_draft_too_short: Object.fromEntries(
        sections.map((s) => [s.id, s.text]),
      ),
    });
    const lengthRetry = await llmCompletion(
      LUU_NIEN_CORE_JSON_LENGTH_RETRY,
      lengthUser,
      READING_MAX_TOKENS_LUU_NIEN_JSON,
      jsonTimeout(),
      llmOpts,
    );
    const expanded = lengthRetry ? parseLuuNienCoreSections(lengthRetry) : null;
    if (
      expanded &&
      expanded.length === LUU_NIEN_CORE_SECTION_ORDER.length
    ) {
      const origTotal = sections.reduce((a, s) => a + s.text.length, 0);
      const newTotal = expanded.reduce((a, s) => a + s.text.length, 0);
      const expandedOk = !luuNienCoreSectionsNeedLengthRetry(expanded);
      if (expandedOk || newTotal > origTotal * 1.08) {
        sections = expanded;
      }
    }
  }

  return sections;
}

async function cacheAndReturnSections(
  ctx: GenerateContext,
  sections: LaSoChiTietSection[],
): Promise<GenerateResult> {
  const { endpoint, admin, now, cacheKey } = ctx;
  const toStore = JSON.stringify({ sections });
  if (admin) {
    const expiresAt = new Date(now + ttlForEndpoint(endpoint)).toISOString();
    await admin.from("reading_cache").upsert(
      { cache_key: cacheKey, reading: toStore, expires_at: expiresAt },
      { onConflict: "cache_key" },
    );
  }
  return { reading: null, sections };
}

/** Lưu niên (vận năm) — life_areas LLM + nhịp năm 3 phần. */
export async function generateLuuNienReading(
  ctx: GenerateContext,
): Promise<GenerateResult> {
  const { endpoint, payload, onlyLuuNienLife, onlyLuuNienCore } = ctx;
  const budget = createEdgeBudget(GENERATE_READING_EDGE_BUDGET_MS);

  if (onlyLuuNienLife) {
    const lifeSections = await generateLuuNienLifeAreaSections(payload, budget);
    if (lifeSections.length > 0) {
      return cacheAndReturnSections(ctx, lifeSections);
    }
  } else if (onlyLuuNienCore) {
    const coreSections = await generateLuuNienCoreSections(ctx, budget);
    if (coreSections?.length) {
      return cacheAndReturnSections(ctx, coreSections);
    }
  } else {
    const lifeSections = await generateLuuNienLifeAreaSections(payload, budget);
    const coreSections = await generateLuuNienCoreSections(ctx, budget);
    const merged = [...lifeSections, ...(coreSections ?? [])];
    if (merged.length > 0) {
      return cacheAndReturnSections(ctx, merged);
    }
  }

  if (!budget.canSpend(PROSE_ROUND_MIN_MS)) {
    return { reading: null };
  }
  const profile = llmProfileForEndpoint(endpoint);
  const proseTimeout = () =>
    budget.callTimeout(
      Math.min(TIEU_VAN_PROSE_CALL_TIMEOUT_MS, LUU_NIEN_TIMEOUT_MS),
    );
  const reading = await llmLegacyProse(
    SYSTEM_PROMPT,
    payload,
    READING_MAX_TOKENS_LUU_NIEN,
    proseTimeout(),
    profile,
  );
  if (!reading) return { reading: null };
  if (admin) {
    const expiresAt = new Date(now + ttlForEndpoint(endpoint)).toISOString();
    await admin.from("reading_cache").upsert(
      { cache_key: cacheKey, reading, expires_at: expiresAt },
      { onConflict: "cache_key" },
    );
  }
  return { reading };
}
