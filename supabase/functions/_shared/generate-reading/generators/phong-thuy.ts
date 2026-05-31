import {
  LA_SO_CHI_TIET_TIMEOUT_MS,
  READING_MAX_TOKENS_PHONG_THUY_BLOCK,
  ttlForEndpoint,
} from "../core/config.ts";
import {
  createEdgeBudget,
  GENERATE_READING_EDGE_BUDGET_MS,
} from "../core/edge-budget.ts";
import { llmLaSoChiTietJson } from "../core/llm.ts";
import type { GenerateContext, GenerateResult } from "../core/types.ts";
import type { LaSoChiTietSection } from "../core/types.ts";
import {
  parsePhongThuyBlockResponse,
  PHONG_THUY_HUONG_SECTION_ID,
  PHONG_THUY_MAU_SECTION_ID,
  PHONG_THUY_PHI_TINH_SECTION_ID,
} from "../parsers/phong-thuy.ts";
import {
  PHONG_THUY_BLOCK_RETRY_SYSTEM,
  PHONG_THUY_HUONG_SYSTEM,
  PHONG_THUY_MAU_SYSTEM,
  PHONG_THUY_PHI_TINH_SYSTEM,
} from "../prompts/phong-thuy.ts";

const JSON_ROUND_MIN_MS = 10_000;

async function generatePhongThuyBlock(
  system: string,
  payload: string,
  sectionId:
    | typeof PHONG_THUY_HUONG_SECTION_ID
    | typeof PHONG_THUY_MAU_SECTION_ID
    | typeof PHONG_THUY_PHI_TINH_SECTION_ID,
  budget: ReturnType<typeof createEdgeBudget>,
): Promise<LaSoChiTietSection | null> {
  const timeout = () => budget.callTimeout(LA_SO_CHI_TIET_TIMEOUT_MS);
  const opts = { timeoutMs: timeout(), disableThinking: true };

  const raw = await llmLaSoChiTietJson(
    system,
    payload,
    READING_MAX_TOKENS_PHONG_THUY_BLOCK,
    opts,
  );
  if (!raw) return null;

  let section = parsePhongThuyBlockResponse(raw, sectionId);
  let retryRaw: string | null = null;
  if (!section && budget.canSpend(JSON_ROUND_MIN_MS)) {
    retryRaw = await llmLaSoChiTietJson(
      PHONG_THUY_BLOCK_RETRY_SYSTEM,
      payload,
      READING_MAX_TOKENS_PHONG_THUY_BLOCK,
      { ...opts, timeoutMs: budget.callTimeout(LA_SO_CHI_TIET_TIMEOUT_MS) },
    );
    if (retryRaw) section = parsePhongThuyBlockResponse(retryRaw, sectionId);
  }
  if (!section) {
    section = parsePhongThuyBlockResponse(raw, sectionId, true);
  }
  if (!section && retryRaw) {
    section = parsePhongThuyBlockResponse(retryRaw, sectionId, true);
  }
  return section;
}

/** §04 — 3 khối luận: hướng · màu · phi tinh. */
export async function generatePhongThuyReading(
  ctx: GenerateContext,
): Promise<GenerateResult> {
  const { endpoint, payload, admin, now, cacheKey } = ctx;
  const budget = createEdgeBudget(GENERATE_READING_EDGE_BUDGET_MS);

  const [huong, mau, phiTinh] = await Promise.all([
    generatePhongThuyBlock(
      PHONG_THUY_HUONG_SYSTEM,
      payload,
      PHONG_THUY_HUONG_SECTION_ID,
      budget,
    ),
    generatePhongThuyBlock(
      PHONG_THUY_MAU_SYSTEM,
      payload,
      PHONG_THUY_MAU_SECTION_ID,
      budget,
    ),
    generatePhongThuyBlock(
      PHONG_THUY_PHI_TINH_SYSTEM,
      payload,
      PHONG_THUY_PHI_TINH_SECTION_ID,
      budget,
    ),
  ]);

  let sections = [huong, mau, phiTinh].filter(
    (s): s is LaSoChiTietSection => s != null,
  );

  if (sections.length === 0) {
    // All 3 parallel calls failed — attempt sequential single-block retry
    const fallbackPairs: Array<[
      string,
      typeof PHONG_THUY_HUONG_SECTION_ID | typeof PHONG_THUY_MAU_SECTION_ID | typeof PHONG_THUY_PHI_TINH_SECTION_ID
    ]> = [
      [PHONG_THUY_HUONG_SYSTEM, PHONG_THUY_HUONG_SECTION_ID],
      [PHONG_THUY_MAU_SYSTEM, PHONG_THUY_MAU_SECTION_ID],
      [PHONG_THUY_PHI_TINH_SYSTEM, PHONG_THUY_PHI_TINH_SECTION_ID],
    ];
    for (const [sys, id] of fallbackPairs) {
      if (!budget.canSpend(JSON_ROUND_MIN_MS)) break;
      const block = await generatePhongThuyBlock(sys, payload, id, budget);
      if (block) sections.push(block);
    }
    if (sections.length === 0) return { reading: null };
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
