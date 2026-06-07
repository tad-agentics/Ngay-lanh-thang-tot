import {
  READING_MAX_TOKENS_TIEU_VAN,
  READING_MAX_TOKENS_TIEU_VAN_JSON,
  TIEU_VAN_JSON_TIMEOUT_MS,
  TIEU_VAN_TIMEOUT_MS,
  ttlForEndpoint,
} from "../core/config.ts";
import { persistReadingCache } from "../core/cache-persist.ts";
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
  parseTieuVanSections,
  tieuVanSectionsNeedLengthRetry,
  TIEU_VAN_SECTION_ORDER,
} from "../parsers/tieu-van.ts";
import { SYSTEM_PROMPT } from "../prompts/legacy-prose.ts";
import {
  TIEU_VAN_JSON_LENGTH_RETRY,
  TIEU_VAN_JSON_RETRY,
  TIEU_VAN_JSON_SYSTEM,
} from "../prompts/tieu-van.ts";

const JSON_ROUND_MIN_MS = 10_000;
const LENGTH_ROUND_MIN_MS = 10_000;
const PROSE_ROUND_MIN_MS = 8_000;

async function generateTieuVanJsonSections(
  ctx: GenerateContext,
  budget: ReturnType<typeof createEdgeBudget>,
): Promise<LaSoChiTietSection[] | null> {
  const { payload, data } = ctx;
  const profile = llmProfileForEndpoint("tieu-van");
  const llmOpts = {
    profile,
    jsonMode: true as const,
    disableThinking: true,
  };

  const jsonTimeout = () =>
    budget.callTimeout(
      Math.min(TIEU_VAN_JSON_CALL_TIMEOUT_MS, TIEU_VAN_JSON_TIMEOUT_MS),
    );

  if (!budget.canSpend(JSON_ROUND_MIN_MS)) return null;

  const rawJson = await llmCompletion(
    TIEU_VAN_JSON_SYSTEM,
    payload,
    READING_MAX_TOKENS_TIEU_VAN_JSON,
    jsonTimeout(),
    llmOpts,
  );
  let sections = rawJson ? parseTieuVanSections(rawJson) : null;

  if (!sections?.length && budget.canSpend(JSON_ROUND_MIN_MS)) {
    const retry = await llmCompletion(
      TIEU_VAN_JSON_RETRY,
      payload,
      READING_MAX_TOKENS_TIEU_VAN_JSON,
      jsonTimeout(),
      llmOpts,
    );
    sections = retry ? parseTieuVanSections(retry) : null;
  }

  if (
    sections?.length &&
    tieuVanSectionsNeedLengthRetry(sections) &&
    budget.canSpend(LENGTH_ROUND_MIN_MS)
  ) {
    const lengthUser = stableStringify({
      endpoint: "tieu-van",
      data,
      previous_draft_too_short: Object.fromEntries(
        sections.map((s) => [s.id, s.text]),
      ),
    });
    const lengthRetry = await llmCompletion(
      TIEU_VAN_JSON_LENGTH_RETRY,
      lengthUser,
      READING_MAX_TOKENS_TIEU_VAN_JSON,
      jsonTimeout(),
      llmOpts,
    );
    const expanded = lengthRetry ? parseTieuVanSections(lengthRetry) : null;
    if (expanded && expanded.length === TIEU_VAN_SECTION_ORDER.length) {
      const origTotal = sections.reduce((a, s) => a + s.text.length, 0);
      const newTotal = expanded.reduce((a, s) => a + s.text.length, 0);
      const expandedOk = !tieuVanSectionsNeedLengthRetry(expanded);
      if (expandedOk || newTotal > origTotal * 1.08) {
        sections = expanded;
      }
    }
  }

  return sections;
}

/** Tiểu vận tháng — JSON 3 phần hoặc prose fallback. */
export async function generateTieuVanReading(
  ctx: GenerateContext,
): Promise<GenerateResult> {
  const { endpoint, payload, admin, now, cacheKey } = ctx;
  const profile = llmProfileForEndpoint(endpoint);
  const budget = createEdgeBudget(GENERATE_READING_EDGE_BUDGET_MS);

  const sections = await generateTieuVanJsonSections(ctx, budget);

  if (sections?.length) {
    const toStore = JSON.stringify({ sections });
    if (admin) {
      const expiresAt = new Date(now + ttlForEndpoint(endpoint)).toISOString();
      await persistReadingCache(admin, cacheKey, toStore, expiresAt);
    }
    return { reading: null, sections };
  }

  if (!budget.canSpend(PROSE_ROUND_MIN_MS)) {
    return { reading: null };
  }
  const proseTimeout = () =>
    budget.callTimeout(
      Math.min(TIEU_VAN_PROSE_CALL_TIMEOUT_MS, TIEU_VAN_TIMEOUT_MS),
    );
  const reading = await llmLegacyProse(
    SYSTEM_PROMPT,
    payload,
    READING_MAX_TOKENS_TIEU_VAN,
    proseTimeout(),
    profile,
  );
  if (!reading) return { reading: null };
  if (admin) {
    const expiresAt = new Date(now + ttlForEndpoint(endpoint)).toISOString();
    await persistReadingCache(admin, cacheKey, reading, expiresAt);
  }
  return { reading };
}
