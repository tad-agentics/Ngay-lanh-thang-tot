import {
  LA_SO_CHI_TIET_TIMEOUT_MS,
  READING_MAX_TOKENS_PHONG_THUY_BLOCK,
  ttlForEndpoint,
} from "../core/config.ts";
import { persistReadingCache } from "../core/cache-persist.ts";
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
  PHONG_THUY_SECTION_IDS,
  phongThuyBlockFromSections,
  phongThuyMissingBlockIds,
} from "../parsers/phong-thuy.ts";
import {
  PHONG_THUY_BLOCK_RETRY_SYSTEM,
  PHONG_THUY_HUONG_SYSTEM,
  PHONG_THUY_MAU_SYSTEM,
  PHONG_THUY_PHI_TINH_SYSTEM,
} from "../prompts/phong-thuy.ts";

const JSON_ROUND_MIN_MS = 10_000;

type PhongThuyBlockId =
  | typeof PHONG_THUY_HUONG_SECTION_ID
  | typeof PHONG_THUY_MAU_SECTION_ID
  | typeof PHONG_THUY_PHI_TINH_SECTION_ID;

const BLOCK_DEFS: Array<{ id: PhongThuyBlockId; system: string }> = [
  { id: PHONG_THUY_HUONG_SECTION_ID, system: PHONG_THUY_HUONG_SYSTEM },
  { id: PHONG_THUY_MAU_SECTION_ID, system: PHONG_THUY_MAU_SYSTEM },
  { id: PHONG_THUY_PHI_TINH_SECTION_ID, system: PHONG_THUY_PHI_TINH_SYSTEM },
];

const SYSTEM_BY_ID = Object.fromEntries(
  BLOCK_DEFS.map((d) => [d.id, d.system]),
) as Record<PhongThuyBlockId, string>;

async function generatePhongThuyBlock(
  system: string,
  payload: string,
  sectionId: PhongThuyBlockId,
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

function orderedSections(
  byId: Map<PhongThuyBlockId, LaSoChiTietSection>,
): LaSoChiTietSection[] {
  return PHONG_THUY_SECTION_IDS.map((id) => byId.get(id)).filter(
    (s): s is LaSoChiTietSection => s != null,
  );
}

function seedBlocksById(
  seed: LaSoChiTietSection[],
): Map<PhongThuyBlockId, LaSoChiTietSection> {
  const byId = new Map<PhongThuyBlockId, LaSoChiTietSection>();
  for (const id of PHONG_THUY_SECTION_IDS) {
    const block = phongThuyBlockFromSections(seed, id);
    if (block) byId.set(id, block);
  }
  return byId;
}

async function generateAllBlocksParallel(
  payload: string,
  budget: ReturnType<typeof createEdgeBudget>,
): Promise<LaSoChiTietSection[]> {
  const [huong, mau, phiTinh] = await Promise.all(
    BLOCK_DEFS.map(({ system, id }) =>
      generatePhongThuyBlock(system, payload, id, budget)
    ),
  );
  return [huong, mau, phiTinh].filter(
    (s): s is LaSoChiTietSection => s != null,
  );
}

async function generateMissingBlocksSequential(
  payload: string,
  budget: ReturnType<typeof createEdgeBudget>,
  byId: Map<PhongThuyBlockId, LaSoChiTietSection>,
  missing: PhongThuyBlockId[],
): Promise<void> {
  for (const id of missing) {
    if (!budget.canSpend(JSON_ROUND_MIN_MS)) break;
    const block = await generatePhongThuyBlock(
      SYSTEM_BY_ID[id],
      payload,
      id,
      budget,
    );
    if (block) byId.set(id, block);
  }
}

async function cachePhongThuySections(
  ctx: GenerateContext,
  sections: LaSoChiTietSection[],
): Promise<void> {
  const { endpoint, admin, now, cacheKey } = ctx;
  if (!admin || sections.length === 0) return;
  const toStore = JSON.stringify({ sections });
  const expiresAt = new Date(now + ttlForEndpoint(endpoint)).toISOString();
  await persistReadingCache(admin, cacheKey, toStore, expiresAt);
}

/** §04 — 3 khối luận: hướng · màu · phi tinh. */
export async function generatePhongThuyReading(
  ctx: GenerateContext,
): Promise<GenerateResult> {
  const { payload } = ctx;
  const budget = createEdgeBudget(GENERATE_READING_EDGE_BUDGET_MS);
  const seed = ctx.phongThuySeedSections ?? [];
  const byId = seedBlocksById(seed);
  const missing = phongThuyMissingBlockIds(seed);

  if (missing.length === 0 && byId.size === PHONG_THUY_SECTION_IDS.length) {
    const sections = orderedSections(byId);
    await cachePhongThuySections(ctx, sections);
    return { reading: null, sections };
  }

  if (missing.length === PHONG_THUY_SECTION_IDS.length) {
    let sections = await generateAllBlocksParallel(payload, budget);
    if (sections.length === 0) {
      const fallbackById = new Map<PhongThuyBlockId, LaSoChiTietSection>();
      await generateMissingBlocksSequential(
        payload,
        budget,
        fallbackById,
        [...PHONG_THUY_SECTION_IDS],
      );
      sections = orderedSections(fallbackById);
    }
    if (sections.length === 0) return { reading: null };
    await cachePhongThuySections(ctx, sections);
    return { reading: null, sections };
  }

  await generateMissingBlocksSequential(payload, budget, byId, missing);

  let sections = orderedSections(byId);
  if (sections.length === 0) {
    sections = await generateAllBlocksParallel(payload, budget);
    if (sections.length === 0) {
      const fallbackById = new Map<PhongThuyBlockId, LaSoChiTietSection>();
      await generateMissingBlocksSequential(
        payload,
        budget,
        fallbackById,
        [...PHONG_THUY_SECTION_IDS],
      );
      sections = orderedSections(fallbackById);
    }
  }

  if (sections.length === 0) return { reading: null };

  await cachePhongThuySections(ctx, sections);
  return { reading: null, sections };
}
