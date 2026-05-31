import {
  LA_SO_CHI_TIET_TIMEOUT_MS,
  READING_MAX_TOKENS_LUU_NIEN_LIFE_AREAS,
} from "../core/config.ts";
import type { EdgeBudget } from "../core/edge-budget.ts";
import { llmLaSoChiTietJson } from "../core/llm.ts";
import type { LaSoChiTietSection } from "../core/types.ts";
import {
  luuNienLifeAreaProseTooShort,
  luuNienLifeAreasToSections,
  parseLuuNienLifeAreasResponse,
} from "../parsers/luu-nien-life.ts";
import {
  LUU_NIEN_LIFE_AREAS_RETRY_SYSTEM,
  LUU_NIEN_LIFE_AREAS_SYSTEM,
} from "../prompts/luu-nien-life.ts";

const JSON_ROUND_MIN_MS = 12_000;

function callTimeout(budget: EdgeBudget): number {
  return budget.callTimeout(LA_SO_CHI_TIET_TIMEOUT_MS);
}

/** §03 — luận ~500 chữ / 3 đoạn / lĩnh vực vận năm. */
export async function generateLuuNienLifeAreaSections(
  payload: string,
  budget: EdgeBudget,
): Promise<LaSoChiTietSection[]> {
  if (!budget.canSpend(JSON_ROUND_MIN_MS)) return [];

  const raw = await llmLaSoChiTietJson(
    LUU_NIEN_LIFE_AREAS_SYSTEM,
    payload,
    READING_MAX_TOKENS_LUU_NIEN_LIFE_AREAS,
    { timeoutMs: callTimeout(budget), disableThinking: true },
  );
  if (!raw) return [];

  let parsed = parseLuuNienLifeAreasResponse(raw);
  if (!parsed?.areas.length && budget.canSpend(JSON_ROUND_MIN_MS)) {
    const retry = await llmLaSoChiTietJson(
      LUU_NIEN_LIFE_AREAS_RETRY_SYSTEM,
      payload,
      READING_MAX_TOKENS_LUU_NIEN_LIFE_AREAS,
      { timeoutMs: callTimeout(budget), disableThinking: true },
    );
    if (retry) parsed = parseLuuNienLifeAreasResponse(retry);
  }

  if (!parsed?.areas.length) {
    const relaxed = parseLuuNienLifeAreasResponse(raw, { relaxed: true });
    if (relaxed?.areas.length) parsed = relaxed;
  }

  // Length retry: relaxed-accepted areas are still short — try expanding before accepting
  if (parsed?.areas.length && budget.canSpend(JSON_ROUND_MIN_MS)) {
    const hasShort = parsed.areas.some((s) => luuNienLifeAreaProseTooShort(s.text));
    if (hasShort) {
      const lengthRetry = await llmLaSoChiTietJson(
        LUU_NIEN_LIFE_AREAS_RETRY_SYSTEM,
        payload,
        READING_MAX_TOKENS_LUU_NIEN_LIFE_AREAS,
        { timeoutMs: callTimeout(budget), disableThinking: true },
      );
      if (lengthRetry) {
        const retryParsed = parseLuuNienLifeAreasResponse(lengthRetry);
        if (retryParsed?.areas.length) parsed = retryParsed;
      }
    }
  }

  if (!parsed) return [];
  const sections = luuNienLifeAreasToSections(parsed);
  if (sections.length === 0) {
    console.warn(
      "[luận-giải] luu-nien life_areas: parse rỗng hoặc quá ngắn",
      raw.slice(0, 280),
    );
  }
  return sections;
}
