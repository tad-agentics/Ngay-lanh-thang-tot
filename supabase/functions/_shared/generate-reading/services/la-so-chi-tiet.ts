import { LA_SO_CHI_TIET_TIMEOUT_MS } from "../core/config.ts";
import { llmCompletion, llmLaSoChiTietJson } from "../core/llm.ts";
import { llmProfileForEndpoint } from "../core/llm-profiles.ts";
import type { LaSoChiTietSection } from "../core/types.ts";
import {
  LA_SO_CHI_TIET_PREVIEW_EXPAND_SYSTEM,
  LA_SO_CHI_TIET_PREVIEW_SYSTEM,
  LA_SO_CHI_TIET_RETRY_SYSTEM,
  LA_SO_CHI_TIET_SYSTEM,
} from "../prompts/la-so.ts";
import { SYSTEM_PROMPT } from "../prompts/legacy-prose.ts";
import {
  laSoChiTietPreviewSections,
  menhSectionFromParsed,
  menhTongQuanFallbackSection,
  menhTongQuanProseTooShort,
  parseLaSoChiTietSections,
} from "../parsers/la-so.ts";

const LA_SO_CHI_TIET_PROFILE = llmProfileForEndpoint("la-so-chi-tiet");

export async function generateLaSoChiTietPreviewSections(
  payload: string,
): Promise<LaSoChiTietSection[] | null> {
  const raw = await llmLaSoChiTietJson(
    LA_SO_CHI_TIET_PREVIEW_SYSTEM,
    payload,
    1024,
  );
  if (!raw) return null;
  let sections = parseLaSoChiTietSections(raw);
  if (!sections?.length) {
    const retry = await llmLaSoChiTietJson(
      LA_SO_CHI_TIET_PREVIEW_SYSTEM,
      payload,
      1024,
    );
    if (retry) sections = parseLaSoChiTietSections(retry);
  }
  if (!sections?.length) {
    const plain = await llmCompletion(
      SYSTEM_PROMPT,
      payload,
      1024,
      LA_SO_CHI_TIET_TIMEOUT_MS,
      { profile: LA_SO_CHI_TIET_PROFILE },
    );
    const t = plain?.trim() ?? "";
    if (!t) return null;
    return [menhTongQuanFallbackSection(t)];
  }

  let menh = menhSectionFromParsed(sections);
  if (menh && menhTongQuanProseTooShort(menh.text)) {
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
      1024,
      LA_SO_CHI_TIET_TIMEOUT_MS,
      { jsonMode: true, profile: LA_SO_CHI_TIET_PROFILE },
    );
    if (expandRaw) {
      const expanded = menhSectionFromParsed(
        parseLaSoChiTietSections(expandRaw),
      );
      if (expanded && !menhTongQuanProseTooShort(expanded.text)) {
        menh = expanded;
      }
    }
  }

  return menh ? [menh] : laSoChiTietPreviewSections(sections);
}

export async function generateLaSoChiTietFullSections(
  payload: string,
): Promise<LaSoChiTietSection[] | null> {
  const raw = await llmLaSoChiTietJson(LA_SO_CHI_TIET_SYSTEM, payload);
  if (!raw) return null;
  let sections = parseLaSoChiTietSections(raw);
  if (!sections?.length) {
    const retryText = await llmLaSoChiTietJson(
      LA_SO_CHI_TIET_RETRY_SYSTEM,
      payload,
    );
    if (retryText) sections = parseLaSoChiTietSections(retryText);
  }
  if (!sections?.length) {
    console.warn(
      "[luận-giải] la-so-chi-tiet: JSON rỗng — thử một khối văn",
      raw.slice(0, 240),
    );
    const plain = await llmCompletion(
      SYSTEM_PROMPT,
      payload,
      512,
      LA_SO_CHI_TIET_TIMEOUT_MS,
      { profile: LA_SO_CHI_TIET_PROFILE },
    );
    const t = plain?.trim() ?? "";
    if (!t) return null;
    return [
      {
        id: "tong_hop",
        title: "Luận giải",
        text: t,
      },
    ];
  }
  return sections;
}
