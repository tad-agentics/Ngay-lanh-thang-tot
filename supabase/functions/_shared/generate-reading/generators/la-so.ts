import {
  READING_MAX_TOKENS_DEFAULT,
  REQUEST_TIMEOUT_MS,
  ttlForEndpoint,
} from "../core/config.ts";
import { persistReadingCache } from "../core/cache-persist.ts";
import { llmLegacyProse } from "../core/llm.ts";
import type { GenerateContext, GenerateResult } from "../core/types.ts";
import { SYSTEM_PROMPT } from "../prompts/legacy-prose.ts";
import { generatePhongThuyReading } from "./phong-thuy.ts";
import { menhTongQuanProseTooShort } from "../parsers/la-so.ts";
import {
  generateLaSoChiTietFullSections,
  generateLaSoChiTietPreviewSections,
  generateLaSoChiTietTinhCachOnlySections,
} from "../services/la-so-chi-tiet.ts";

function previewMenhIsStorable(
  sections: { id: string; text: string }[],
): boolean {
  const menh = sections.find((s) => s.id === "menh_tong_quan");
  if (!menh?.text?.trim()) return false;
  return !menhTongQuanProseTooShort(menh.text);
}

export async function generateLaSoReading(
  ctx: GenerateContext,
): Promise<GenerateResult> {
  const { endpoint, payload, preview, onlyTinhCach, admin, now, cacheKey } = ctx;

  if (endpoint === "phong-thuy") {
    return generatePhongThuyReading(ctx);
  }

  if (endpoint === "la-so-chi-tiet") {
    if (onlyTinhCach) {
      const sections = await generateLaSoChiTietTinhCachOnlySections(payload);
      if (!sections.length) return { reading: null };
      const toStore = JSON.stringify({ sections });
      if (admin) {
        const expiresAt = new Date(now + ttlForEndpoint(endpoint)).toISOString();
        await persistReadingCache(admin, cacheKey, toStore, expiresAt);
      }
      return { reading: null, sections };
    }

    if (preview) {
      const sectionsOut = await generateLaSoChiTietPreviewSections(payload);
      if (!sectionsOut?.length || !previewMenhIsStorable(sectionsOut)) {
        return { reading: null };
      }
      const toStore = JSON.stringify({ sections: sectionsOut });
      if (admin) {
        const expiresAt = new Date(now + ttlForEndpoint(endpoint)).toISOString();
        await persistReadingCache(admin, cacheKey, toStore, expiresAt);
      }
      return { reading: null, sections: sectionsOut };
    }

    const sections = await generateLaSoChiTietFullSections(payload);
    if (!sections?.length) return { reading: null };
    const toStore = JSON.stringify({ sections });
    if (admin) {
      const expiresAt = new Date(now + ttlForEndpoint(endpoint)).toISOString();
      await persistReadingCache(admin, cacheKey, toStore, expiresAt);
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
    await persistReadingCache(admin, cacheKey, reading, expiresAt);
  }
  return { reading };
}
