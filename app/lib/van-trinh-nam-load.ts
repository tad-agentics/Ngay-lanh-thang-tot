import { toast } from "sonner";

import type { Profile } from "~/lib/profile-context";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import {
  coalesceGenerateReadingSections,
  invokeGenerateReadingWithRetry,
  type LaSoChiTietSection,
} from "~/lib/generate-reading";
import {
  deliveryToLoadResult,
  fetchVanTrinhNamDelivery,
  persistVanTrinhNamDelivery,
  vanTrinhNamDeliveryIsComplete,
} from "~/lib/van-trinh-nam-delivery";
import {
  listMissingVanTrinhWaves,
  type VanTrinhWaveTarget,
} from "~/lib/van-trinh-nam-delivery-complete";
import {
  createInitialVanTrinhChapterLoadState,
  deriveVanTrinhChapterLoadState,
  type VanTrinhChapterLoadState,
} from "~/lib/van-trinh-nam-chapter-load";
import {
  parseVanTrinhNamLuanContext,
  validateVanTrinhNamMonths,
  yearCanChiFromContext,
} from "~/lib/van-trinh-nam-parse";
import {
  persistVanTrinhNamSession,
  readVanTrinhNamSession,
  vanTrinhNamCacheRevision,
  type VanTrinhNamSessionData,
} from "~/lib/van-trinh-nam-session";
import type { VanTrinhNamLuanContext } from "~/lib/van-trinh-nam-types";

const WAVE_STAGGER_MS = 1_500;
const GAP_FILL_WARM_RETRY_MS = 1_200;

export type VanTrinhNamLoadResult = VanTrinhNamSessionData & {
  networkInterrupted?: boolean;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchVanTrinhNamContext(
  profile: Profile,
  year: number,
): Promise<VanTrinhNamLuanContext | null> {
  const body = profileToBatTuPersonQuery(profile);
  if (!body.birth_date) return null;

  const res = await invokeBatTu<unknown>({
    op: "luu-nien-luan-context",
    body: { ...body, year },
  });
  if (!res.ok) {
    toast.error(res.message ?? "Không tải được vận trình năm.");
    return null;
  }
  const ctx = parseVanTrinhNamLuanContext(res.data);
  if (!ctx || !validateVanTrinhNamMonths(ctx)) {
    toast.error("Dữ liệu vận trình năm không đầy đủ — thử lại sau.");
    return null;
  }
  return ctx;
}

function mergeSections(
  base: LaSoChiTietSection[],
  incoming: LaSoChiTietSection[] | null,
): LaSoChiTietSection[] {
  return coalesceGenerateReadingSections(base, incoming);
}

async function wavePartA(
  ctx: VanTrinhNamLuanContext,
  year: number,
): Promise<LaSoChiTietSection[]> {
  const gen = await invokeGenerateReadingWithRetry({
    endpoint: "van-trinh-nam",
    data: { luan_context: ctx, flow_year: year },
    only_van_trinh_a: true,
  });
  return gen.sections ?? [];
}

async function waveMonth(
  ctx: VanTrinhNamLuanContext,
  year: number,
  monthNum: number,
): Promise<LaSoChiTietSection[]> {
  const gen = await invokeGenerateReadingWithRetry({
    endpoint: "van-trinh-nam",
    data: { luan_context: ctx, flow_year: year },
    month_num: monthNum,
  });
  return gen.sections ?? [];
}

async function waveClosing(
  ctx: VanTrinhNamLuanContext,
  year: number,
): Promise<LaSoChiTietSection[]> {
  const gen = await invokeGenerateReadingWithRetry({
    endpoint: "van-trinh-nam",
    data: { luan_context: ctx, flow_year: year },
    only_van_trinh_c: true,
  });
  return gen.sections ?? [];
}

async function invokeWaveTarget(
  ctx: VanTrinhNamLuanContext,
  year: number,
  target: VanTrinhWaveTarget,
): Promise<LaSoChiTietSection[]> {
  if (target.kind === "part_a") return wavePartA(ctx, year);
  if (target.kind === "closing") return waveClosing(ctx, year);
  return waveMonth(ctx, year, target.monthNum);
}

async function invokeWaveTargetWithWarmRetry(
  ctx: VanTrinhNamLuanContext,
  year: number,
  target: VanTrinhWaveTarget,
): Promise<LaSoChiTietSection[]> {
  let part = await invokeWaveTarget(ctx, year, target);
  if (part.length > 0) return part;
  await sleep(GAP_FILL_WARM_RETRY_MS);
  part = await invokeWaveTarget(ctx, year, target);
  return part;
}

export function blockKeyToVanTrinhWaveTarget(
  blockKey: string,
): VanTrinhWaveTarget | null {
  if (blockKey === "part_a") return { kind: "part_a" };
  if (blockKey === "closing") return { kind: "closing" };
  if (blockKey.startsWith("month_")) {
    const monthNum = Number(blockKey.replace("month_", ""));
    if (monthNum >= 1 && monthNum <= 12) {
      return { kind: "month", monthNum };
    }
  }
  return null;
}

async function gapFillVanTrinhWaves(
  ctx: VanTrinhNamLuanContext,
  year: number,
  sections: LaSoChiTietSection[],
  targets: VanTrinhWaveTarget[],
): Promise<LaSoChiTietSection[]> {
  let merged = sections;
  for (let i = 0; i < targets.length; i += 1) {
    if (i > 0) await sleep(WAVE_STAGGER_MS);
    const part = await invokeWaveTargetWithWarmRetry(ctx, year, targets[i]!);
    if (part.length > 0) merged = mergeSections(merged, part);
  }
  return merged;
}

export async function loadVanTrinhNamRetryWaves(
  profile: Profile,
  year: number,
  ctx: VanTrinhNamLuanContext,
  existingSections: LaSoChiTietSection[],
  targets: VanTrinhWaveTarget[],
  opts?: {
    onProgress?: (partial: VanTrinhNamLoadResult, load: VanTrinhChapterLoadState) => void;
  },
): Promise<VanTrinhNamLoadResult> {
  const yearCanChi = yearCanChiFromContext(ctx);
  const engineVersion = ctx.meta.engine_version;
  let sections = existingSections;
  let networkInterrupted = false;

  const emit = (bundleFinished: boolean) => {
    const load = deriveVanTrinhChapterLoadState(sections, { bundleFinished });
    opts?.onProgress?.(
      {
        sections,
        yearCanChi,
        luanContext: ctx,
        engineVersion,
        networkInterrupted,
      },
      load,
    );
  };

  emit(false);
  sections = await gapFillVanTrinhWaves(ctx, year, sections, targets);
  const stillMissing = listMissingVanTrinhWaves(sections, ctx);
  if (stillMissing.length > 0) networkInterrupted = true;
  emit(true);

  return {
    sections,
    yearCanChi,
    luanContext: ctx,
    engineVersion,
    networkInterrupted,
  };
}

export async function loadVanTrinhNamFull(
  profile: Profile,
  year: number,
  ctx: VanTrinhNamLuanContext,
  opts?: {
    onProgress?: (partial: VanTrinhNamLoadResult, load: VanTrinhChapterLoadState) => void;
    /** Chỉ chạy các wave thiếu (resume / prewarm partial). */
    existingSections?: LaSoChiTietSection[];
  },
): Promise<VanTrinhNamLoadResult> {
  const yearCanChi = yearCanChiFromContext(ctx);
  const engineVersion = ctx.meta.engine_version;
  let sections = opts?.existingSections ?? [];
  let networkInterrupted = false;

  const emit = (bundleFinished: boolean) => {
    const load = deriveVanTrinhChapterLoadState(sections, { bundleFinished });
    opts?.onProgress?.(
      {
        sections,
        yearCanChi,
        luanContext: ctx,
        engineVersion,
        networkInterrupted,
      },
      load,
    );
  };

  emit(false);

  const missingBefore = listMissingVanTrinhWaves(sections, ctx);
  const runAll = missingBefore.length === 0 && sections.length === 0;

  if (runAll || missingBefore.some((t) => t.kind === "part_a")) {
    const a = await invokeWaveTargetWithWarmRetry(ctx, year, { kind: "part_a" });
    if (a.length === 0) networkInterrupted = true;
    sections = mergeSections(sections, a);
    emit(false);
    await sleep(WAVE_STAGGER_MS);
  }

  for (let m = 1; m <= 12; m += 1) {
    const needMonth =
      runAll ||
      missingBefore.some((t) => t.kind === "month" && t.monthNum === m);
    if (!needMonth) continue;
    const part = await invokeWaveTargetWithWarmRetry(ctx, year, {
      kind: "month",
      monthNum: m,
    });
    if (part.length === 0) networkInterrupted = true;
    sections = mergeSections(sections, part);
    emit(false);
    if (m < 12) await sleep(WAVE_STAGGER_MS);
  }

  const needClosing =
    runAll || missingBefore.some((t) => t.kind === "closing");
  if (needClosing) {
    await sleep(WAVE_STAGGER_MS);
    const c = await invokeWaveTargetWithWarmRetry(ctx, year, { kind: "closing" });
    if (c.length === 0) networkInterrupted = true;
    sections = mergeSections(sections, c);
    emit(false);
  }

  const gapTargets = listMissingVanTrinhWaves(sections, ctx);
  if (gapTargets.length > 0) {
    sections = await gapFillVanTrinhWaves(ctx, year, sections, gapTargets);
    if (listMissingVanTrinhWaves(sections, ctx).length > 0) {
      networkInterrupted = true;
    }
  }

  emit(true);

  return {
    sections,
    yearCanChi,
    luanContext: ctx,
    engineVersion,
    networkInterrupted,
  };
}

export function cachedSessionIsComplete(
  data: VanTrinhNamSessionData,
): boolean {
  return vanTrinhNamDeliveryIsComplete(data.sections, data.luanContext);
}

export { createInitialVanTrinhChapterLoadState, deriveVanTrinhChapterLoadState };

export type { VanTrinhChapterLoadState };

export {
  deliveryToLoadResult,
  fetchVanTrinhNamDelivery,
  persistVanTrinhNamDelivery,
  readVanTrinhNamSession,
  persistVanTrinhNamSession,
  vanTrinhNamCacheRevision,
};
