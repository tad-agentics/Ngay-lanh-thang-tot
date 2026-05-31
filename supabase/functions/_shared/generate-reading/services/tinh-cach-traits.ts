import {
  LA_SO_CHI_TIET_TIMEOUT_MS,
  READING_MAX_TOKENS_TINH_CACH_TRAITS,
} from "../core/config.ts";
import type { EdgeBudget } from "../core/edge-budget.ts";
import { llmLaSoChiTietJson } from "../core/llm.ts";
import type { LaSoChiTietSection } from "../core/types.ts";
import {
  parseTinhCachTraitsResponse,
  tinhCachTraitsToLaSoSections,
} from "../parsers/la-so.ts";
import {
  LA_SO_TINH_CACH_TRAITS_RETRY_SYSTEM,
  LA_SO_TINH_CACH_TRAITS_SYSTEM,
} from "../prompts/la-so.ts";

const JSON_ROUND_MIN_MS = 12_000;

function callTimeout(budget: EdgeBudget): number {
  return budget.callTimeout(LA_SO_CHI_TIET_TIMEOUT_MS);
}

/** §02 — luận dài từng personality_readings (500–600 từ / mục). */
export async function generateTinhCachTraitSections(
  payload: string,
  budget: EdgeBudget,
): Promise<LaSoChiTietSection[]> {
  if (!budget.canSpend(JSON_ROUND_MIN_MS)) return [];

  const raw = await llmLaSoChiTietJson(
    LA_SO_TINH_CACH_TRAITS_SYSTEM,
    payload,
    READING_MAX_TOKENS_TINH_CACH_TRAITS,
    { timeoutMs: callTimeout(budget) },
  );
  if (!raw) return [];

  let parsed = parseTinhCachTraitsResponse(raw);
  if (
    (!parsed?.traits.length || !parsed.intro) &&
    budget.canSpend(JSON_ROUND_MIN_MS)
  ) {
    const retry = await llmLaSoChiTietJson(
      LA_SO_TINH_CACH_TRAITS_RETRY_SYSTEM,
      payload,
      READING_MAX_TOKENS_TINH_CACH_TRAITS,
      { timeoutMs: callTimeout(budget) },
    );
    if (retry) parsed = parseTinhCachTraitsResponse(retry);
  }

  if (!parsed) return [];
  const sections = tinhCachTraitsToLaSoSections(parsed);
  if (sections.length === 0) {
    console.warn(
      "[luận-giải] tinh-cach-traits: parse rỗng hoặc quá ngắn",
      raw.slice(0, 280),
    );
  }
  return sections;
}
