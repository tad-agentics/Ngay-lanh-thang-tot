import {
  READING_MAX_TOKENS_DEFAULT,
  REQUEST_TIMEOUT_MS,
  ttlForEndpoint,
} from "../core/config.ts";
import { llmLegacyProse } from "../core/llm.ts";
import type { GenerateContext, GenerateResult } from "../core/types.ts";
import { SYSTEM_PROMPT } from "../prompts/legacy-prose.ts";
import {
  generateLaSoChiTietFullSections,
  generateLaSoChiTietPreviewSections,
} from "../services/la-so-chi-tiet.ts";

export async function generateLaSoReading(
  ctx: GenerateContext,
): Promise<GenerateResult> {
  const { endpoint, payload, preview, admin, now, cacheKey } = ctx;

  if (endpoint === "la-so-chi-tiet") {
    if (preview) {
      const sectionsOut = await generateLaSoChiTietPreviewSections(payload);
      if (!sectionsOut?.length) return { reading: null };
      const toStore = JSON.stringify({ sections: sectionsOut });
      if (admin) {
        const expiresAt = new Date(now + ttlForEndpoint(endpoint)).toISOString();
        await admin.from("reading_cache").upsert(
          { cache_key: cacheKey, reading: toStore, expires_at: expiresAt },
          { onConflict: "cache_key" },
        );
      }
      return { reading: null, sections: sectionsOut };
    }

    const sections = await generateLaSoChiTietFullSections(payload);
    if (!sections?.length) return { reading: null };
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

  const reading = await llmLegacyProse(
    SYSTEM_PROMPT,
    payload,
    READING_MAX_TOKENS_DEFAULT,
    REQUEST_TIMEOUT_MS,
    "flash",
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
