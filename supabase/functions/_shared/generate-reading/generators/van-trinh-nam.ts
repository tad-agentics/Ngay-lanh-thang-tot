import {
  READING_MAX_TOKENS_TIEU_VAN_JSON,
  TIEU_VAN_JSON_TIMEOUT_MS,
} from "../core/config.ts";
import {
  createEdgeBudget,
  GENERATE_READING_EDGE_BUDGET_MS,
  TIEU_VAN_JSON_CALL_TIMEOUT_MS,
} from "../core/edge-budget.ts";
import { llmCompletion } from "../core/llm.ts";
import { llmProfileForEndpoint } from "../core/llm-profiles.ts";
import type { GenerateContext, GenerateResult } from "../core/types.ts";
import type { LaSoChiTietSection } from "../core/types.ts";
import {
  parseVanTrinhNamSections,
  vanTrinhNamSectionsNeedLengthRetry,
} from "../parsers/van-trinh-nam.ts";
import {
  VAN_TRINH_NAM_JSON_RETRY,
  VAN_TRINH_NAM_JSON_SYSTEM,
} from "../prompts/van-trinh-nam.ts";
import { ttlForEndpoint } from "../core/config.ts";

async function generateVanTrinhNamJsonSections(
  ctx: GenerateContext,
): Promise<LaSoChiTietSection[] | null> {
  const profile = llmProfileForEndpoint("van-trinh-nam");
  const budget = createEdgeBudget(GENERATE_READING_EDGE_BUDGET_MS);
  const jsonTimeout = () =>
    budget.callTimeout(
      Math.min(TIEU_VAN_JSON_CALL_TIMEOUT_MS, TIEU_VAN_JSON_TIMEOUT_MS),
    );

  const rawJson = await llmCompletion(
    VAN_TRINH_NAM_JSON_SYSTEM,
    ctx.payload,
    READING_MAX_TOKENS_TIEU_VAN_JSON,
    jsonTimeout(),
    { profile, jsonMode: true },
  );
  let sections = rawJson ? parseVanTrinhNamSections(rawJson) : null;

  if (
    (!sections?.length || vanTrinhNamSectionsNeedLengthRetry(sections)) &&
    budget.canSpend(8_000)
  ) {
    const retry = await llmCompletion(
      VAN_TRINH_NAM_JSON_RETRY,
      ctx.payload,
      READING_MAX_TOKENS_TIEU_VAN_JSON,
      jsonTimeout(),
      { profile, jsonMode: true },
    );
    const parsed = retry ? parseVanTrinhNamSections(retry) : null;
    if (parsed?.length) sections = parsed;
  }

  return sections;
}

export async function generateVanTrinhNamReading(
  ctx: GenerateContext,
): Promise<GenerateResult> {
  const { endpoint, admin, now, cacheKey } = ctx;
  const sections = await generateVanTrinhNamJsonSections(ctx);

  if (sections?.length) {
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

  return { reading: null, sections: null };
}
