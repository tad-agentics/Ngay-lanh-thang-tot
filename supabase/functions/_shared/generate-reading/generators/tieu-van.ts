import {
  READING_MAX_TOKENS_TIEU_VAN_LUU_NIEN,
  READING_MAX_TOKENS_TIEU_VAN_LUU_NIEN_JSON,
  TIEU_VAN_LUU_NIEN_JSON_TIMEOUT_MS,
  TIEU_VAN_LUU_NIEN_TIMEOUT_MS,
  ttlForEndpoint,
} from "../core/config.ts";
import { llmCompletion, llmLegacyProse } from "../core/llm.ts";
import { llmProfileForEndpoint } from "../core/llm-profiles.ts";
import { stableStringify } from "../core/cache.ts";
import type { GenerateContext, GenerateResult } from "../core/types.ts";
import {
  parseTieuVanLuuNienSections,
  tieuVanSectionsNeedLengthRetry,
  TIEU_VAN_LUU_NIEN_SECTION_ORDER,
} from "../parsers/tieu-van.ts";
import { SYSTEM_PROMPT } from "../prompts/legacy-prose.ts";
import {
  TIEU_VAN_LUU_NIEN_JSON_LENGTH_RETRY,
  TIEU_VAN_LUU_NIEN_JSON_RETRY,
  TIEU_VAN_LUU_NIEN_JSON_SYSTEM,
} from "../prompts/tieu-van.ts";

export async function generateTieuVanReading(
  ctx: GenerateContext,
): Promise<GenerateResult> {
  const { endpoint, payload, data, admin, now, cacheKey } = ctx;
  const profile = llmProfileForEndpoint(endpoint);
  const llmOpts = { profile, jsonMode: true as const };

  const rawJson = await llmCompletion(
    TIEU_VAN_LUU_NIEN_JSON_SYSTEM,
    payload,
    READING_MAX_TOKENS_TIEU_VAN_LUU_NIEN_JSON,
    TIEU_VAN_LUU_NIEN_JSON_TIMEOUT_MS,
    llmOpts,
  );
  let sections = rawJson
    ? parseTieuVanLuuNienSections(rawJson, endpoint)
    : null;
  if (!sections?.length) {
    const retry = await llmCompletion(
      TIEU_VAN_LUU_NIEN_JSON_RETRY,
      payload,
      READING_MAX_TOKENS_TIEU_VAN_LUU_NIEN_JSON,
      TIEU_VAN_LUU_NIEN_JSON_TIMEOUT_MS,
      llmOpts,
    );
    sections = retry ? parseTieuVanLuuNienSections(retry, endpoint) : null;
  }
  if (sections?.length && tieuVanSectionsNeedLengthRetry(sections)) {
    const lengthUser = stableStringify({
      endpoint,
      data,
      previous_draft_too_short: Object.fromEntries(
        sections.map((s) => [s.id, s.text]),
      ),
    });
    const lengthRetry = await llmCompletion(
      TIEU_VAN_LUU_NIEN_JSON_LENGTH_RETRY,
      lengthUser,
      READING_MAX_TOKENS_TIEU_VAN_LUU_NIEN_JSON,
      TIEU_VAN_LUU_NIEN_JSON_TIMEOUT_MS,
      llmOpts,
    );
    const expanded = lengthRetry
      ? parseTieuVanLuuNienSections(lengthRetry, endpoint)
      : null;
    if (
      expanded &&
      expanded.length === TIEU_VAN_LUU_NIEN_SECTION_ORDER.length
    ) {
      const origTotal = sections.reduce((a, s) => a + s.text.length, 0);
      const newTotal = expanded.reduce((a, s) => a + s.text.length, 0);
      const expandedOk = !tieuVanSectionsNeedLengthRetry(expanded);
      if (expandedOk || newTotal > origTotal * 1.08) {
        sections = expanded;
      }
    }
  }
  if (!sections?.length) {
    console.warn(
      "[luận-giải] tieu-van/luu-nien: JSON 3 phần thất bại — dùng một khối văn",
      rawJson?.slice(0, 200),
    );
    const reading = await llmLegacyProse(
      SYSTEM_PROMPT,
      payload,
      READING_MAX_TOKENS_TIEU_VAN_LUU_NIEN,
      TIEU_VAN_LUU_NIEN_TIMEOUT_MS,
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
