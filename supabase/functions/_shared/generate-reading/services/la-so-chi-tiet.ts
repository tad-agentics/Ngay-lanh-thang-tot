import {
  LA_SO_CHI_TIET_TIMEOUT_MS,
  READING_MAX_TOKENS_LA_SO_PREVIEW,
} from "../core/config.ts";
import {
  createEdgeBudget,
  GENERATE_READING_EDGE_BUDGET_MS,
  type EdgeBudget,
} from "../core/edge-budget.ts";
import { llmCompletion, llmLaSoChiTietJson } from "../core/llm.ts";
import { llmProfileForEndpoint } from "../core/llm-profiles.ts";
import type { LaSoChiTietSection } from "../core/types.ts";
import {
  LA_SO_ASPECT_ORDER,
  laSoChiTietPreviewSections,
  menhSectionFromParsed,
  menhTongQuanFallbackSection,
  menhTongQuanProseTooShort,
  parseLaSoChiTietSections,
} from "../parsers/la-so.ts";
import {
  LA_SO_CHI_TIET_ASPECTS_RETRY_SYSTEM,
  LA_SO_CHI_TIET_ASPECTS_SYSTEM,
  LA_SO_CHI_TIET_PREVIEW_EXPAND_SYSTEM,
  LA_SO_CHI_TIET_PREVIEW_SYSTEM,
  LA_SO_CHI_TIET_RETRY_SYSTEM,
  LA_SO_CHI_TIET_SYSTEM,
} from "../prompts/la-so.ts";
import { generateTinhCachTraitSections } from "./tinh-cach-traits.ts";
import { SYSTEM_PROMPT } from "../prompts/legacy-prose.ts";

const LA_SO_CHI_TIET_PROFILE = llmProfileForEndpoint("la-so-chi-tiet");
const LA_SO_PREVIEW_LLM_OPTS = { disableThinking: true } as const;

const JSON_ROUND_MIN_MS = 10_000;
const EXPAND_ROUND_MIN_MS = 8_000;
const PROSE_ROUND_MIN_MS = 8_000;

const ASPECT_IDS = new Set<string>(
  LA_SO_ASPECT_ORDER.filter((id) => id !== "menh_tong_quan" && id !== "tinh_cach"),
);

function laSoCallTimeout(budget: EdgeBudget): number {
  return budget.callTimeout(LA_SO_CHI_TIET_TIMEOUT_MS);
}

function filterAspectSections(
  sections: LaSoChiTietSection[] | null,
): LaSoChiTietSection[] {
  if (!sections?.length) return [];
  return sections.filter((s) => ASPECT_IDS.has(s.id));
}

async function expandMenhTongQuanIfShort(
  menh: LaSoChiTietSection,
  payload: string,
  budget: EdgeBudget,
): Promise<LaSoChiTietSection> {
  if (!menhTongQuanProseTooShort(menh.text)) return menh;
  if (!budget.canSpend(EXPAND_ROUND_MIN_MS)) {
    console.warn(
      "[luận-giải] la-so-chi-tiet: bỏ expand menh — hết budget",
      budget.elapsed(),
    );
    return menh;
  }

  const expandRaw = await llmCompletion(
    LA_SO_CHI_TIET_PREVIEW_EXPAND_SYSTEM,
    JSON.stringify({
      endpoint: "la-so-chi-tiet",
      menh_tong_quan_hien_tai: menh.text,
      ...(() => {
        try {
          const o = JSON.parse(payload) as Record<string, unknown>;
          return { data: o.data };
        } catch {
          return {};
        }
      })(),
    }),
    READING_MAX_TOKENS_LA_SO_PREVIEW,
    laSoCallTimeout(budget),
    {
      jsonMode: true,
      profile: LA_SO_CHI_TIET_PROFILE,
      disableThinking: true,
    },
  );
  if (!expandRaw) return menh;

  const expanded = menhSectionFromParsed(parseLaSoChiTietSections(expandRaw));
  if (expanded && !menhTongQuanProseTooShort(expanded.text)) {
    return expanded;
  }
  return menh;
}

/** §01 — cùng prompt + luồng LLM với paywall preview. */
export async function generateMenhTongQuanSection(
  payload: string,
  budget: EdgeBudget,
): Promise<LaSoChiTietSection | null> {
  if (!budget.canSpend(JSON_ROUND_MIN_MS)) return null;

  const raw = await llmLaSoChiTietJson(
    LA_SO_CHI_TIET_PREVIEW_SYSTEM,
    payload,
    READING_MAX_TOKENS_LA_SO_PREVIEW,
    { ...LA_SO_PREVIEW_LLM_OPTS, timeoutMs: laSoCallTimeout(budget) },
  );
  if (!raw) return null;

  let sections = parseLaSoChiTietSections(raw);
  if (!sections?.length && budget.canSpend(JSON_ROUND_MIN_MS)) {
    const retry = await llmLaSoChiTietJson(
      LA_SO_CHI_TIET_PREVIEW_SYSTEM,
      payload,
      READING_MAX_TOKENS_LA_SO_PREVIEW,
      { ...LA_SO_PREVIEW_LLM_OPTS, timeoutMs: laSoCallTimeout(budget) },
    );
    if (retry) sections = parseLaSoChiTietSections(retry);
  }

  if (!sections?.length) {
    if (!budget.canSpend(PROSE_ROUND_MIN_MS)) return null;
    const plain = await llmCompletion(
      SYSTEM_PROMPT,
      payload,
      READING_MAX_TOKENS_LA_SO_PREVIEW,
      laSoCallTimeout(budget),
      { profile: LA_SO_CHI_TIET_PROFILE, disableThinking: true },
    );
    const t = plain?.trim() ?? "";
    if (!t) return null;
    return menhTongQuanFallbackSection(t);
  }

  let menh = menhSectionFromParsed(sections);
  if (!menh) {
    const picked = laSoChiTietPreviewSections(sections)[0];
    menh = picked ?? null;
  }
  if (!menh) return null;

  return expandMenhTongQuanIfShort(menh, payload, budget);
}

/** §02–§06 — tách khỏi §01 để không tranh prompt với preview. */
async function generateLaSoChiTietAspectSections(
  payload: string,
  budget: EdgeBudget,
): Promise<LaSoChiTietSection[]> {
  if (!budget.canSpend(JSON_ROUND_MIN_MS)) return [];

  const raw = await llmLaSoChiTietJson(
    LA_SO_CHI_TIET_ASPECTS_SYSTEM,
    payload,
    2048,
    { timeoutMs: laSoCallTimeout(budget) },
  );
  if (!raw) return [];

  let sections = filterAspectSections(parseLaSoChiTietSections(raw));
  if (!sections.length && budget.canSpend(JSON_ROUND_MIN_MS)) {
    const retryText = await llmLaSoChiTietJson(
      LA_SO_CHI_TIET_ASPECTS_RETRY_SYSTEM,
      payload,
      2048,
      { timeoutMs: laSoCallTimeout(budget) },
    );
    if (retryText) {
      sections = filterAspectSections(parseLaSoChiTietSections(retryText));
    }
  }
  return sections;
}

/** Fallback một lần gọi khi tách §01 / aspects đều trống. */
async function generateLaSoChiTietCombinedFallback(
  payload: string,
  budget: EdgeBudget,
): Promise<LaSoChiTietSection[] | null> {
  if (!budget.canSpend(JSON_ROUND_MIN_MS)) return null;

  const raw = await llmLaSoChiTietJson(LA_SO_CHI_TIET_SYSTEM, payload, 2048, {
    timeoutMs: laSoCallTimeout(budget),
  });
  if (!raw) return null;

  let sections = parseLaSoChiTietSections(raw);
  if (!sections?.length && budget.canSpend(JSON_ROUND_MIN_MS)) {
    const retryText = await llmLaSoChiTietJson(
      LA_SO_CHI_TIET_RETRY_SYSTEM,
      payload,
      2048,
      { timeoutMs: laSoCallTimeout(budget) },
    );
    if (retryText) sections = parseLaSoChiTietSections(retryText);
  }
  if (!sections?.length) {
    if (!budget.canSpend(PROSE_ROUND_MIN_MS)) return null;
    const plain = await llmCompletion(
      SYSTEM_PROMPT,
      payload,
      512,
      laSoCallTimeout(budget),
      { profile: LA_SO_CHI_TIET_PROFILE },
    );
    const t = plain?.trim() ?? "";
    if (!t) return null;
    return [menhTongQuanFallbackSection(t)];
  }

  const menhIdx = sections.findIndex((s) => s.id === "menh_tong_quan");
  if (menhIdx >= 0) {
    const expanded = await expandMenhTongQuanIfShort(
      sections[menhIdx]!,
      payload,
      budget,
    );
    sections = [
      ...sections.slice(0, menhIdx),
      expanded,
      ...sections.slice(menhIdx + 1),
    ];
  }
  return sections;
}

export async function generateLaSoChiTietPreviewSections(
  payload: string,
): Promise<LaSoChiTietSection[] | null> {
  const budget = createEdgeBudget(GENERATE_READING_EDGE_BUDGET_MS);
  const menh = await generateMenhTongQuanSection(payload, budget);
  return menh ? [menh] : null;
}

/** §02 only — fresh edge budget (client supplement when full bundle thiếu traits). */
export async function generateLaSoChiTietTinhCachOnlySections(
  payload: string,
): Promise<LaSoChiTietSection[]> {
  const budget = createEdgeBudget(GENERATE_READING_EDGE_BUDGET_MS);
  return generateTinhCachTraitSections(payload, budget);
}

export async function generateLaSoChiTietFullSections(
  payload: string,
): Promise<LaSoChiTietSection[] | null> {
  const budget = createEdgeBudget(GENERATE_READING_EDGE_BUDGET_MS);

  /** §01 trước §02 — tránh hai gọi JSON song song tranh cùng edge budget. */
  const menh = await generateMenhTongQuanSection(payload, budget);
  const tinhCach = await generateTinhCachTraitSections(payload, budget);

  if (menh || tinhCach.length > 0) {
    return [...(menh ? [menh] : []), ...tinhCach];
  }

  console.warn(
    "[luận-giải] la-so-chi-tiet full: §01/§02 trống — fallback một lần gọi",
    budget.elapsed(),
  );
  return generateLaSoChiTietCombinedFallback(payload, budget);
}
