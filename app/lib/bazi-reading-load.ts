import { toast } from "sonner";

import type { LaSoJson } from "~/lib/api-types";
import {
  deliveryToLoadResult,
  fetchBaziReadingDelivery,
  persistBaziReadingDelivery,
} from "~/lib/bazi-reading-delivery";
import type { Profile } from "~/lib/profile-context";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import {
  buildBaziDisplayChapters,
  fallbackFlowYearCanChiLabel,
  flowYearCanChiFromFacts,
  hasMenhTongQuanLuanFromSections,
  menhTongQuanProseFromSections,
  type BaziDisplayChapter,
} from "~/lib/bazi-reading-outline";
import {
  coalesceGenerateReadingSections,
  invokeGenerateReading,
  invokeGenerateReadingWithRetry,
  normalizeLaSoSectionsInput,
  type GenerateReadingResponse,
  type LaSoChiTietSection,
} from "~/lib/generate-reading";
import {
  extractLaSoChiTietEnrichment,
  mergeLaSoJsonForChiTietDisplay,
} from "~/lib/la-so-ui";
import { fetchLuuNienYearFacts } from "~/lib/luu-nien-facts";
import { parseLuuNienFactsView } from "~/lib/luu-nien-facts-ui";
import {
  luuNienSectionsFromGenerateReading,
  mergeLaSoWithLuuNienSections,
  hasLuuNienQuyNhanLuanFromSections,
  mergeLuuNienGenerateSections,
} from "~/lib/luu-nien-ui";
import { fetchPhongThuyYearFacts } from "~/lib/phong-thuy-facts";
import { parsePhongThuyFactsView } from "~/lib/phong-thuy-facts-ui";
import {
  hasPhongThuyLuanFromSections,
  mergeBaziReadingWithPhongThuy,
  phongThuySectionsFromGenerateReading,
} from "~/lib/phong-thuy-ui";
import {
  hasLuuNienLifeLuanFromSections,
  missingLuuNienLifeAreaIds,
} from "~/lib/luu-nien-life-ui";
import {
  createInitialChapterLoadState,
  deriveChapterLoadState,
  type BaziChapterLoadState,
} from "~/lib/bazi-chapter-load";
import {
  hasTinhCachLuanFromSections,
  mergeLaSoTinhCachSections,
  missingTinhCachTraitIds,
} from "~/lib/personality-traits-ui";
import { isBaziReadingScreenLoadActive } from "~/lib/bazi-reading-load-coord";
import { baziReadingDeliveryIsComplete } from "../../shared/bazi-reading-delivery-complete.ts";

export { baziReadingDeliveryIsComplete };

const BAZI_INVOKE_STAGGER_MS = 1_500;
/** Khớp `RATE_LIMIT_RETRY_MS` trong `generate-reading.ts`. */
const BAZI_MENH_WAVE_RETRY_MS = 11_000;
/**
 * Gap-fill rỗng ở lần đầu (client bị ngắt) trong khi Edge vẫn cache xong → thử lại
 * 1 lần để hứng cache ấm (~200ms), tránh mất hẳn một mục dù Edge đã sinh.
 */
const BAZI_GAP_FILL_WARM_RETRY_MS = 1_200;
/** Preview §01 trước Wave 2 — tránh 8× la-so khi mệnh còn trống. */
const BAZI_MENH_PREVIEW_MAX_ATTEMPTS = 2;

export type BaziReadingLoadResult = {
  sections: LaSoChiTietSection[];
  laSoDisplay: LaSoJson | null;
  luuNienFactsRaw: unknown | null;
  phongThuyFactsRaw: unknown | null;
  yearCanChi: string;
  /** `bat-tu` op `phong-thuy` failed — §04 may be empty despite other chapters OK. */
  phongThuyFetchError: string | null;
  /** Ít nhất một invoke Edge bị Chrome ngắt (tab background / đổi mạng). */
  networkInterrupted?: boolean;
};

const BAZI_NETWORK_INTERRUPTED_TOAST_ID = "bazi-network-interrupted";

function noteGenerateTransport(
  res: { transportError?: string },
  flags: { networkInterrupted: boolean },
): void {
  if (res.transportError === "network_interrupted") {
    flags.networkInterrupted = true;
  }
}

/** Facts lá số + lưu niên + phong thủy — không gọi LLM. */
export type BaziReadingFactsBundle = Omit<BaziReadingLoadResult, "sections"> & {
  /** Raw `bat-tu` la-so response — tái dùng cho generate-reading. */
  lasoRaw?: unknown;
};

export function buildBaziSkeletonChapters(
  facts: BaziReadingFactsBundle,
): BaziDisplayChapter[] {
  return buildBaziDisplayChapters({
    sections: [],
    laSo: facts.laSoDisplay,
    luuNienFactsRaw: facts.luuNienFactsRaw,
    phongThuyFactsRaw: facts.phongThuyFactsRaw,
    yearCanChi: facts.yearCanChi,
    phongThuyFetchError: facts.phongThuyFetchError,
    chapterLoad: createInitialChapterLoadState(),
  });
}

/** Tải facts song song — hiển thị skeleton trước khi DeepSeek xong. */
export async function fetchBaziReadingFactsBundle(
  profile: Profile,
  year: number,
  options?: { silentPhongThuyToast?: boolean },
): Promise<BaziReadingFactsBundle | null> {
  const body = profileToBatTuPersonQuery(profile);
  if (!body.birth_date) return null;

  const [lasoRes, luuNienRes, phongThuyRes] = await Promise.all([
    invokeBatTu<unknown>({ op: "la-so", body }),
    fetchLuuNienYearFacts(profile, year),
    fetchPhongThuyYearFacts(profile, year),
  ]);

  if (!lasoRes.ok) {
    toast.error(lasoRes.message ?? "Không tải lá số.");
    return null;
  }

  const enrichment = extractLaSoChiTietEnrichment(lasoRes.data);
  const laSoDisplay =
    mergeLaSoJsonForChiTietDisplay(
      profile.la_so as LaSoJson,
      enrichment,
    ) ?? (profile.la_so as LaSoJson);

  const luuNienFactsRaw = luuNienRes.ok ? luuNienRes.data : null;
  const phongThuyFactsRaw = phongThuyRes.ok ? phongThuyRes.data : null;
  const phongThuyFetchError = phongThuyRes.ok
    ? null
    : (phongThuyRes.message ?? "Không tải phong thủy năm.");
  if (!phongThuyRes.ok && !options?.silentPhongThuyToast) {
    toast.error(phongThuyFetchError);
  }

  return {
    laSoDisplay,
    luuNienFactsRaw,
    phongThuyFactsRaw,
    yearCanChi: resolveYearCanChi(year, luuNienFactsRaw),
    phongThuyFetchError,
    lasoRaw: lasoRes.data,
  };
}

function laSoSectionsFromGenerateReading(
  sections: LaSoChiTietSection[] | null,
  reading: string | null,
): LaSoChiTietSection[] {
  return coalesceGenerateReadingSections(sections, reading);
}

function resolveYearCanChi(
  year: number,
  luuNienRaw: unknown | null,
): string {
  const fromFacts = luuNienRaw
    ? flowYearCanChiFromFacts(luuNienRaw) ||
      parseLuuNienFactsView(luuNienRaw)?.yearCanChi
    : null;
  return fromFacts || fallbackFlowYearCanChiLabel(year) || "";
}

export type BaziPaywallBundle = {
  laSoDisplay: LaSoJson | null;
  menhOverview: string;
  /** `la-so` OK nhưng preview luận rỗng (Edge/DeepSeek/rate limit). */
  menhGenFailed: boolean;
};

/** Rút đoạn `menh_tong_quan` từ sections generate-reading. */
export function menhOverviewFromLaSoSections(
  sections: LaSoChiTietSection[],
): string {
  return menhTongQuanProseFromSections(sections);
}

function deliveryHasMenhProse(sections: LaSoChiTietSection[]): boolean {
  return hasMenhTongQuanLuanFromSections(sections);
}

function deliveryHasFullLuanSections(
  sections: LaSoChiTietSection[],
  luuNienFactsRaw?: unknown | null,
  phongThuyFactsRaw?: unknown | null,
): boolean {
  return baziReadingDeliveryIsComplete(sections, {
    luuNienFactsRaw,
    phongThuyFactsRaw,
  });
}

/**
 * Paywall §01 — một lần `la-so` + DeepSeek preview (`menh_tong_quan` only).
 */
export async function loadBaziPaywallBundle(
  profile: Profile,
): Promise<BaziPaywallBundle> {
  const cachedLaSo = (profile.la_so as LaSoJson) ?? null;
  const body = profileToBatTuPersonQuery(profile);
  if (!body.birth_date) {
    return { laSoDisplay: cachedLaSo, menhOverview: "", menhGenFailed: false };
  }

  const lasoRes = await invokeBatTu<unknown>({ op: "la-so", body });
  if (!lasoRes.ok) {
    return { laSoDisplay: cachedLaSo, menhOverview: "", menhGenFailed: false };
  }

  const enrichment = extractLaSoChiTietEnrichment(lasoRes.data);
  const laSoDisplay =
    mergeLaSoJsonForChiTietDisplay(cachedLaSo, enrichment) ?? cachedLaSo;

  const gen = await invokeGenerateReading({
    endpoint: "la-so-chi-tiet",
    data: lasoRes.data,
    preview: true,
  });
  const sections = laSoSectionsFromGenerateReading(gen.sections, gen.reading);
  const menhOverview = menhOverviewFromLaSoSections(sections);

  return {
    laSoDisplay,
    menhOverview,
    menhGenFailed: !menhOverview,
  };
}

/** @deprecated Dùng `loadBaziPaywallBundle`. */
export async function loadBaziPaywallLaSoDisplay(
  profile: Profile,
): Promise<LaSoJson | null> {
  const bundle = await loadBaziPaywallBundle(profile);
  return bundle.laSoDisplay;
}

/** DeepSeek `la-so-chi-tiet` — `preview: true` chỉ trả `menh_tong_quan` (paywall §01). */
export async function loadBaziLaSoChiTietSections(
  profile: Profile,
  options?: { preview?: boolean },
): Promise<LaSoChiTietSection[]> {
  if (options?.preview) {
    const bundle = await loadBaziPaywallBundle(profile);
    if (!bundle.menhOverview) return [];
    return [
      {
        id: "menh_tong_quan",
        title: "Mệnh tổng quan",
        text: bundle.menhOverview,
      },
    ];
  }

  const body = profileToBatTuPersonQuery(profile);
  if (!body.birth_date) return [];

  const lasoRes = await invokeBatTu<unknown>({ op: "la-so", body });
  if (!lasoRes.ok) {
    toast.error(lasoRes.message ?? "Không tải lá số.");
    return [];
  }

  const gen = await invokeGenerateReading({
    endpoint: "la-so-chi-tiet",
    data: lasoRes.data,
  });

  return laSoSectionsFromGenerateReading(gen.sections, gen.reading);
}

/** @deprecated Dùng `loadBaziPaywallBundle`. */
export async function loadBaziPaywallMenhOverview(
  profile: Profile,
): Promise<string> {
  const bundle = await loadBaziPaywallBundle(profile);
  return bundle.menhOverview;
}

/** Full load: DB delivery → facts + DeepSeek; lưu lại DB sau generate. */
export async function loadBaziReadingFull(
  profile: Profile,
  year: number,
  options?: {
    skipPersist?: boolean;
    forceRegenerate?: boolean;
    preloadedFacts?: BaziReadingFactsBundle;
    /** `prewarm` — bỏ qua nếu màn luận đang load (tránh chồng Edge). */
    loadSource?: "screen" | "prewarm";
    /** Gọi sau mỗi invoke LLM xong — cập nhật UI từng §, không chờ cả bundle. */
    onProgress?: (
      partial: BaziReadingLoadResult,
      chapterLoad: BaziChapterLoadState,
    ) => void;
  },
): Promise<BaziReadingLoadResult> {
  const empty: BaziReadingLoadResult = {
    sections: [],
    laSoDisplay: (profile.la_so as LaSoJson) ?? null,
    luuNienFactsRaw: null,
    phongThuyFactsRaw: null,
    yearCanChi: fallbackFlowYearCanChiLabel(year) || "",
    phongThuyFetchError: null,
  };

  if (
    options?.loadSource === "prewarm" &&
    isBaziReadingScreenLoadActive()
  ) {
    return empty;
  }

  if (!options?.forceRegenerate) {
    const stored = await fetchBaziReadingDelivery(profile, year);
    if (
      stored &&
      deliveryHasFullLuanSections(
        stored.sections,
        stored.luuNienFactsRaw,
        stored.phongThuyFactsRaw,
      )
    ) {
      return { ...deliveryToLoadResult(stored), phongThuyFetchError: null };
    }
  }

  const body = profileToBatTuPersonQuery(profile);
  if (!body.birth_date) return empty;

  let factsBundle = options?.preloadedFacts;

  if (!factsBundle) {
    const [lasoRes, luuNienRes, phongThuyRes] = await Promise.all([
      invokeBatTu<unknown>({ op: "la-so", body }),
      fetchLuuNienYearFacts(profile, year),
      fetchPhongThuyYearFacts(profile, year),
    ]);

    if (!lasoRes.ok) {
      toast.error(lasoRes.message ?? "Không tải lá số.");
      return empty;
    }

    const enrichment = extractLaSoChiTietEnrichment(lasoRes.data);
    const laSoDisplay =
      mergeLaSoJsonForChiTietDisplay(
        profile.la_so as LaSoJson,
        enrichment,
      ) ?? (profile.la_so as LaSoJson);

    const luuNienFactsRaw = luuNienRes.ok ? luuNienRes.data : null;
    const phongThuyFactsRaw = phongThuyRes.ok ? phongThuyRes.data : null;
    const phongThuyFetchError = phongThuyRes.ok
      ? null
      : (phongThuyRes.message ?? "Không tải phong thủy năm.");
    if (!phongThuyRes.ok) {
      toast.error(phongThuyFetchError);
    }

    factsBundle = {
      laSoDisplay,
      luuNienFactsRaw,
      phongThuyFactsRaw,
      yearCanChi: resolveYearCanChi(year, luuNienFactsRaw),
      phongThuyFetchError,
      lasoRaw: lasoRes.data,
    };
  }

  const {
    laSoDisplay,
    luuNienFactsRaw,
    phongThuyFactsRaw,
    yearCanChi,
    phongThuyFetchError,
    lasoRaw,
  } = factsBundle;

  let lasoData = lasoRaw;
  if (!lasoData) {
    const lasoRes = await invokeBatTu<unknown>({ op: "la-so", body });
    if (!lasoRes.ok) {
      toast.error(lasoRes.message ?? "Không tải lá số.");
      return { ...factsBundle, sections: [] };
    }
    lasoData = lasoRes.data;
  }

  const luuNienResOk = luuNienFactsRaw != null;

  let laSoSections: LaSoChiTietSection[] = [];
  let luuNienSections: LaSoChiTietSection[] = [];
  let phongThuySections: LaSoChiTietSection[] = [];
  const transportFlags = { networkInterrupted: false };

  const mergeSections = () =>
    mergeBaziReadingWithPhongThuy(
      mergeLaSoWithLuuNienSections(laSoSections, luuNienSections),
      phongThuySections,
    );

  const buildPartialResult = (): BaziReadingLoadResult => ({
    sections: mergeSections(),
    laSoDisplay,
    luuNienFactsRaw,
    phongThuyFactsRaw,
    yearCanChi,
    phongThuyFetchError,
  });

  let bundleFinished = false;

  const reportProgress = (finished = false) => {
    const partial = buildPartialResult();
    const chapterLoad = deriveChapterLoadState(partial.sections, {
      luuNienFactsRaw,
      phongThuyFactsRaw,
      phongThuyFetchError,
      bundleFinished: finished,
    });
    options?.onProgress?.(partial, chapterLoad);
  };

  const stagger = (slot: number) =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, slot * BAZI_INVOKE_STAGGER_MS);
    });

  const mergeMenhPreviewSections = (
    incoming: LaSoChiTietSection[],
  ): LaSoChiTietSection[] => {
    if (incoming.length === 0) return laSoSections;
    const incomingIds = new Set(incoming.map((s) => s.id));
    return [
      ...incoming,
      ...laSoSections.filter((s) => !incomingIds.has(s.id)),
    ];
  };

  // Wave 1 — §01 preview: tối đa 3 lần (scope riêng) trước Wave 2.
  for (let menhAttempt = 0; menhAttempt < BAZI_MENH_PREVIEW_MAX_ATTEMPTS; menhAttempt++) {
    if (menhAttempt > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, BAZI_MENH_WAVE_RETRY_MS),
      );
    }
    const menhGen = await invokeGenerateReadingWithRetry({
      endpoint: "la-so-chi-tiet",
      data: lasoData,
      preview: true,
    });
    noteGenerateTransport(menhGen, transportFlags);
    const menhSections = laSoSectionsFromGenerateReading(
      menhGen.sections,
      menhGen.reading,
    );
    laSoSections = mergeMenhPreviewSections(menhSections);
    reportProgress();
    if (
      menhAttempt === 0 &&
      !deliveryHasMenhProse(laSoSections) &&
      menhGen.transportError === "gateway_timeout"
    ) {
      toast.error("Luận tổng quan mất quá lâu — thử tải lại luận.");
    }
    if (deliveryHasMenhProse(laSoSections)) break;
  }

  // Wave 2 — §02 + §03 song song (scope rate limit khác nhau).
  await stagger(0);
  const wave2Tinh = invokeGenerateReadingWithRetry({
    endpoint: "la-so-chi-tiet",
    data: lasoData,
    only_tinh_cach: true,
  });
  const wave2Life = luuNienResOk
    ? invokeGenerateReadingWithRetry({
        endpoint: "luu-nien",
        data: luuNienFactsRaw,
        only_luu_nien_life: true,
      })
    : null;
  const [tinhGen, lifeGen] = await Promise.all([
    wave2Tinh,
    wave2Life ?? Promise.resolve(null),
  ]);
  noteGenerateTransport(tinhGen, transportFlags);
  const tinhSections = laSoSectionsFromGenerateReading(
    tinhGen.sections,
    tinhGen.reading,
  );
  if (tinhSections.length > 0) {
    laSoSections = mergeLaSoTinhCachSections(laSoSections, tinhSections);
  } else if (tinhGen.transportError === "gateway_timeout") {
    toast.error("Luận tính cách mất quá lâu — thử tải lại luận.");
  }
  if (lifeGen) {
    noteGenerateTransport(lifeGen, transportFlags);
    luuNienSections = mergeLuuNienGenerateSections(
      luuNienSectionsFromGenerateReading(lifeGen.sections, lifeGen.reading),
      luuNienSections,
    );
    if (lifeGen.transportError === "gateway_timeout") {
      toast.error("Luận vận năm mất quá lâu — thử tải lại luận.");
    }
  }
  reportProgress();

  if (phongThuyFactsRaw) {
    const phongThuyGen = await invokeGenerateReadingWithRetry({
      endpoint: "phong-thuy",
      data: phongThuyFactsRaw,
    });
    noteGenerateTransport(phongThuyGen, transportFlags);
    phongThuySections = phongThuySectionsFromGenerateReading(
      phongThuyFactsRaw,
      phongThuyGen.sections,
      phongThuyGen.reading,
    );
    reportProgress();
  }

  // Wave 3 — §05 quý nhân.
  if (luuNienResOk) {
    await stagger(1);
    const coreGen = await invokeGenerateReadingWithRetry({
      endpoint: "luu-nien",
      data: luuNienFactsRaw,
      only_luu_nien_core: true,
    });
    noteGenerateTransport(coreGen, transportFlags);
    luuNienSections = mergeLuuNienGenerateSections(
      luuNienSections,
      luuNienSectionsFromGenerateReading(coreGen.sections, coreGen.reading),
    );
    if (coreGen.transportError === "gateway_timeout") {
      toast.error("Luận quý nhân mất quá lâu — thử tải lại luận.");
    }
    reportProgress();
  }

  // Targeted gap-fill — một invoke / mục còn thiếu (snapshot cố định để không bỏ sót).
  const missingTraits = missingTinhCachTraitIds(laSoDisplay, laSoSections);
  for (let i = 0; i < missingTraits.length; i++) {
    await stagger(i + 1);
    let retryTinh: LaSoChiTietSection[] = [];
    for (let attempt = 0; attempt < 2 && retryTinh.length === 0; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, BAZI_GAP_FILL_WARM_RETRY_MS),
        );
      }
      const tinhRetry = await invokeGenerateReadingWithRetry({
        endpoint: "la-so-chi-tiet",
        data: lasoData,
        only_tinh_cach: true,
        tinh_cach_trait_ids: [missingTraits[i]],
      });
      noteGenerateTransport(tinhRetry, transportFlags);
      retryTinh = laSoSectionsFromGenerateReading(
        tinhRetry.sections,
        tinhRetry.reading,
      );
    }
    if (retryTinh.length > 0) {
      laSoSections = mergeLaSoTinhCachSections(laSoSections, retryTinh);
      reportProgress();
    }
  }
  if (luuNienResOk) {
    const luuFacts = parseLuuNienFactsView(luuNienFactsRaw);
    const missingLife = missingLuuNienLifeAreaIds(luuFacts, luuNienSections);
    for (let i = 0; i < missingLife.length; i++) {
      await stagger(i + 1);
      let retryLife: LaSoChiTietSection[] = [];
      for (let attempt = 0; attempt < 2 && retryLife.length === 0; attempt++) {
        if (attempt > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, BAZI_GAP_FILL_WARM_RETRY_MS),
          );
        }
        const lifeRetry = await invokeGenerateReadingWithRetry({
          endpoint: "luu-nien",
          data: luuNienFactsRaw,
          only_luu_nien_life: true,
          luu_nien_life_area_ids: [missingLife[i]],
        });
        noteGenerateTransport(lifeRetry, transportFlags);
        retryLife = luuNienSectionsFromGenerateReading(
          lifeRetry.sections,
          lifeRetry.reading,
        );
      }
      if (retryLife.length > 0) {
        luuNienSections = mergeLuuNienGenerateSections(
          retryLife,
          luuNienSections,
        );
        reportProgress();
      }
    }
  }
  if (luuNienResOk && !hasLuuNienQuyNhanLuanFromSections(luuNienSections)) {
    const coreRetry = await invokeGenerateReadingWithRetry({
      endpoint: "luu-nien",
      data: luuNienFactsRaw,
      only_luu_nien_core: true,
    });
    noteGenerateTransport(coreRetry, transportFlags);
    const retryCore = luuNienSectionsFromGenerateReading(
      coreRetry.sections,
      coreRetry.reading,
    );
    if (retryCore.length > 0) {
      luuNienSections = mergeLuuNienGenerateSections(
        luuNienSections,
        retryCore,
      );
      reportProgress();
    }
  }
  if (phongThuyFactsRaw) {
    const ptFacts = parsePhongThuyFactsView(phongThuyFactsRaw);
    if (!hasPhongThuyLuanFromSections(mergeSections(), ptFacts)) {
      const phongRetry = await invokeGenerateReadingWithRetry({
        endpoint: "phong-thuy",
        data: phongThuyFactsRaw,
      });
      noteGenerateTransport(phongRetry, transportFlags);
      const retryPt = phongThuySectionsFromGenerateReading(
        phongThuyFactsRaw,
        phongRetry.sections,
        phongRetry.reading,
      );
      if (retryPt.length > 0) {
        phongThuySections = retryPt;
        reportProgress();
      }
    }
  }

  bundleFinished = true;
  reportProgress(true);

  const sections = mergeBaziReadingWithPhongThuy(
    mergeLaSoWithLuuNienSections(laSoSections, luuNienSections),
    phongThuySections,
  );

  const result: BaziReadingLoadResult = {
    sections,
    laSoDisplay,
    luuNienFactsRaw,
    phongThuyFactsRaw,
    yearCanChi,
    phongThuyFetchError,
    networkInterrupted: transportFlags.networkInterrupted,
  };

  if (
    transportFlags.networkInterrupted &&
    !deliveryHasFullLuanSections(sections, luuNienFactsRaw, phongThuyFactsRaw)
  ) {
    toast.error(
      "Kết nối bị ngắt khi đang luận — giữ tab mở, rồi thử Tải lại luận.",
      { id: BAZI_NETWORK_INTERRUPTED_TOAST_ID },
    );
  }

  if (
    sections.length > 0 &&
    !phongThuyFetchError &&
    deliveryHasFullLuanSections(sections, luuNienFactsRaw, phongThuyFactsRaw) &&
    !options?.skipPersist
  ) {
    const saved = await persistBaziReadingDelivery(profile, year, result);
    if (!saved && import.meta.env.DEV) {
      console.warn("[bazi-delivery] persist failed after full generate");
    }
  }

  return result;
}

/** @deprecated Use `loadBaziReadingFull` — giữ cho session cache. */
export async function loadBaziReadingSections(
  profile: Profile,
  year: number,
): Promise<LaSoChiTietSection[]> {
  const full = await loadBaziReadingFull(profile, year);
  return full.sections;
}
