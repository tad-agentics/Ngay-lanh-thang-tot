import {
  CHON_NGAY_CARDS_REQUEST_TIMEOUT_MS,
  CHON_NGAY_REQUEST_TIMEOUT_MS,
  DAY_DETAIL_REQUEST_TIMEOUT_MS,
  HOP_TUOI_REQUEST_TIMEOUT_MS,
  READING_MAX_TOKENS_CHON_NGAY,
  READING_MAX_TOKENS_CHON_NGAY_CARDS,
  READING_MAX_TOKENS_DAY_DETAIL,
  READING_MAX_TOKENS_DAY_DETAIL_FOLLOW_UP,
  READING_MAX_TOKENS_HOP_TUOI,
  READING_MAX_TOKENS_INLINE_LICH_TO,
  REQUEST_TIMEOUT_MS,
  ttlForEndpoint,
} from "../core/config.ts";
import { persistReadingCache } from "../core/cache-persist.ts";
import { llmChat, llmCompletion, llmLegacyProse } from "../core/llm.ts";
import { buildDayDetailFollowUpMessages } from "../core/thread-history.ts";
import type { GenerateContext, GenerateResult } from "../core/types.ts";
import { parseChonNgayDayReadingsJson } from "../parsers/chon-ngay.ts";
import {
  CHON_NGAY_CARDS_JSON_RETRY,
  CHON_NGAY_CARDS_JSON_SYSTEM,
  CHON_NGAY_SYSTEM,
  DAY_DETAIL_FOLLOW_UP_SYSTEM,
  DAY_DETAIL_SYSTEM,
  INLINE_LICH_TO_SYSTEM,
} from "../prompts/day.ts";
import { SYSTEM_PROMPT } from "../prompts/legacy-prose.ts";

export async function generateDayReading(
  ctx: GenerateContext,
): Promise<GenerateResult> {
  const { endpoint, payload, admin, now, cacheKey } = ctx;

  if (endpoint === "chon-ngay") {
    const reading = await llmCompletion(
      CHON_NGAY_SYSTEM,
      payload,
      READING_MAX_TOKENS_CHON_NGAY,
      CHON_NGAY_REQUEST_TIMEOUT_MS,
      { profile: "flash" },
    );
    if (!reading) return { reading: null };
    if (admin) {
      const expiresAt = new Date(now + ttlForEndpoint(endpoint)).toISOString();
      await persistReadingCache(admin, cacheKey, reading, expiresAt);
    }
    return { reading };
  }

  if (endpoint === "chon-ngay-cards") {
    const raw = await llmCompletion(
      CHON_NGAY_CARDS_JSON_SYSTEM,
      payload,
      READING_MAX_TOKENS_CHON_NGAY_CARDS,
      CHON_NGAY_CARDS_REQUEST_TIMEOUT_MS,
      { jsonMode: true, profile: "flash" },
    );
    let map = raw ? parseChonNgayDayReadingsJson(raw) : null;
    if (!map || Object.keys(map).length === 0) {
      const retry = await llmCompletion(
        CHON_NGAY_CARDS_JSON_RETRY,
        payload,
        READING_MAX_TOKENS_CHON_NGAY_CARDS,
        CHON_NGAY_CARDS_REQUEST_TIMEOUT_MS,
        { jsonMode: true, profile: "flash" },
      );
      map = retry ? parseChonNgayDayReadingsJson(retry) : null;
    }
    if (!map || Object.keys(map).length === 0) return { reading: null };
    const toStore = JSON.stringify({ day_readings: map });
    if (admin) {
      const expiresAt = new Date(now + ttlForEndpoint(endpoint)).toISOString();
      await persistReadingCache(admin, cacheKey, toStore, expiresAt);
    }
    return { reading: null, dayReadings: map };
  }

  const question =
    typeof ctx.promptBody.question === "string"
      ? ctx.promptBody.question
      : "";
  const variant =
    ctx.promptBody.variant === "inline" ? "inline" : "";

  let reading: string | null;
  if (endpoint === "hop-tuoi") {
    reading = await llmLegacyProse(
      SYSTEM_PROMPT,
      payload,
      READING_MAX_TOKENS_HOP_TUOI,
      HOP_TUOI_REQUEST_TIMEOUT_MS,
      "flash",
    );
  } else if (endpoint === "ngay-hom-nay") {
    reading = await llmCompletion(
      INLINE_LICH_TO_SYSTEM,
      payload,
      READING_MAX_TOKENS_INLINE_LICH_TO,
      REQUEST_TIMEOUT_MS,
      { profile: "flash" },
    );
  } else if (endpoint === "day-detail") {
    if (question) {
      const luanContext = ctx.promptBody.luan_context ?? ctx.data;
      const messages = buildDayDetailFollowUpMessages(
        DAY_DETAIL_FOLLOW_UP_SYSTEM,
        luanContext,
        ctx.anchorReading,
        ctx.threadHistory,
        question,
      );
      reading = await llmChat(
        messages,
        READING_MAX_TOKENS_DAY_DETAIL_FOLLOW_UP,
        DAY_DETAIL_REQUEST_TIMEOUT_MS,
        { profile: "flash", disableThinking: true },
      );
    } else if (variant === "inline") {
      reading = await llmCompletion(
        INLINE_LICH_TO_SYSTEM,
        payload,
        READING_MAX_TOKENS_INLINE_LICH_TO,
        DAY_DETAIL_REQUEST_TIMEOUT_MS,
        { profile: "flash" },
      );
    } else {
      const anchorOpts = { profile: "flash" as const, disableThinking: true };
      reading = await llmCompletion(
        DAY_DETAIL_SYSTEM,
        payload,
        READING_MAX_TOKENS_DAY_DETAIL,
        DAY_DETAIL_REQUEST_TIMEOUT_MS,
        anchorOpts,
      );
      if (!reading) {
        reading = await llmCompletion(
          DAY_DETAIL_SYSTEM,
          payload,
          READING_MAX_TOKENS_DAY_DETAIL,
          DAY_DETAIL_REQUEST_TIMEOUT_MS,
          anchorOpts,
        );
      }
    }
  } else {
    reading = null;
  }

  if (!reading) return { reading: null };
  if (admin) {
    const expiresAt = new Date(now + ttlForEndpoint(endpoint)).toISOString();
    await persistReadingCache(admin, cacheKey, reading, expiresAt);
  }
  return { reading };
}
