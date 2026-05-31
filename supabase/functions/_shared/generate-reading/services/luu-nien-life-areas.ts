import {
  LA_SO_CHI_TIET_TIMEOUT_MS,
  READING_MAX_TOKENS_LUU_NIEN_LIFE_AREAS,
} from "../core/config.ts";
import type { EdgeBudget } from "../core/edge-budget.ts";
import { llmLaSoChiTietJson } from "../core/llm.ts";
import type { LaSoChiTietSection } from "../core/types.ts";
import {
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

/** §03 — luận ~500 từ / lĩnh vực vận năm. */
export async function generateLuuNienLifeAreaSections(
  payload: string,
  budget: EdgeBudget,
): Promise<LaSoChiTietSection[]> {
  if (!budget.canSpend(JSON_ROUND_MIN_MS)) return [];

  const raw = await llmLaSoChiTietJson(
    LUU_NIEN_LIFE_AREAS_SYSTEM,
    payload,
    READING_MAX_TOKENS_LUU_NIEN_LIFE_AREAS,
    { timeoutMs: callTimeout(budget) },
  );
  if (!raw) return [];

  let parsed = parseLuuNienLifeAreasResponse(raw);
  if (
    (!parsed?.areas.length || !parsed.yearIntro) &&
    budget.canSpend(JSON_ROUND_MIN_MS)
  ) {
    const retry = await llmLaSoChiTietJson(
      LUU_NIEN_LIFE_AREAS_RETRY_SYSTEM,
      payload,
      READING_MAX_TOKENS_LUU_NIEN_LIFE_AREAS,
      { timeoutMs: callTimeout(budget) },
    );
    if (retry) parsed = parseLuuNienLifeAreasResponse(retry);
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
