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
  invokeGenerateReading,
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
import { hasLuuNienLifeLuanFromSections } from "~/lib/luu-nien-life-ui";
import {
  hasTinhCachLuanFromSections,
  mergeLaSoTinhCachSections,
} from "~/lib/personality-traits-ui";

export type BaziReadingLoadResult = {
  sections: LaSoChiTietSection[];
  laSoDisplay: LaSoJson | null;
  luuNienFactsRaw: unknown | null;
  phongThuyFactsRaw: unknown | null;
  yearCanChi: string;
  /** `bat-tu` op `phong-thuy` failed — §04 may be empty despite other chapters OK. */
  phongThuyFetchError: string | null;
};

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
    luanPending: true,
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
  const fromModel =
    sections && sections.length > 0
      ? sections
      : reading?.trim()
        ? [{ id: "tong_hop", title: "Luận giải", text: reading.trim() }]
        : [];
  return normalizeLaSoSectionsInput(fromModel);
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

/** Đủ 5 § màn 18 để persist DB / fast-path cache (không regenerate thiếu §04–§05). */
export function baziReadingDeliveryIsComplete(
  sections: LaSoChiTietSection[],
  opts?: {
    luuNienFactsRaw?: unknown | null;
    phongThuyFactsRaw?: unknown | null;
  },
): boolean {
  const luuFacts = opts?.luuNienFactsRaw
    ? parseLuuNienFactsView(opts.luuNienFactsRaw)
    : null;
  const expectedLife = Math.max(1, luuFacts?.lifeAreas.length ?? 4);

  if (!deliveryHasMenhProse(sections)) return false;
  if (!hasTinhCachLuanFromSections(sections)) return false;
  if (!hasLuuNienLifeLuanFromSections(sections, expectedLife)) return false;

  const needsQuy = Boolean(luuFacts?.quyNhan || luuFacts?.daiVanNext);
  if (needsQuy && !hasLuuNienQuyNhanLuanFromSections(sections)) return false;

  if (opts?.phongThuyFactsRaw != null) {
    const ptFacts = parsePhongThuyFactsView(opts.phongThuyFactsRaw);
    if (!hasPhongThuyLuanFromSections(sections, ptFacts)) return false;
  }

  return true;
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
 * Paywall §01 — một lần `la-so` + Gemini preview (`menh_tong_quan` only).
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

/** Gemini `la-so-chi-tiet` — `preview: true` chỉ trả `menh_tong_quan` (paywall §01). */
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
    /** Gọi sau mỗi invoke LLM xong — cập nhật UI từng §, không chờ cả bundle. */
    onProgress?: (partial: BaziReadingLoadResult) => void;
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

  if (!options?.forceRegenerate) {
    const stored = await fetchBaziReadingDelivery(profile, year);
    if (
      stored &&
      deliveryHasFullLuanSections(
        stored.sections,
        stored.luu_nien_facts,
        stored.phong_thuy_facts,
      )
    ) {
      return deliveryToLoadResult(stored);
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
  const expectedLifeAreas = Math.max(
    1,
    parseLuuNienFactsView(luuNienFactsRaw)?.lifeAreas.length ?? 4,
  );

  let laSoSections: LaSoChiTietSection[] = [];
  let luuNienSections: LaSoChiTietSection[] = [];
  let phongThuySections: LaSoChiTietSection[] = [];

  const reportProgress = () => {
    options?.onProgress?.({
      sections: mergeBaziReadingWithPhongThuy(
        mergeLaSoWithLuuNienSections(laSoSections, luuNienSections),
        phongThuySections,
      ),
      laSoDisplay,
      luuNienFactsRaw,
      phongThuyFactsRaw,
      yearCanChi,
      phongThuyFetchError,
    });
  };

  let lifeGenTransport: GenerateReadingResponse["transportError"];
  let coreGenTransport: GenerateReadingResponse["transportError"];
  let tinhGenTransport: GenerateReadingResponse["transportError"];

  await Promise.all([
    (async () => {
      const lasoGen = await invokeGenerateReading({
        endpoint: "la-so-chi-tiet",
        data: lasoData,
      });
      laSoSections = laSoSectionsFromGenerateReading(
        lasoGen.sections,
        lasoGen.reading,
      );
      reportProgress();
      if (
        !menhTongQuanProseFromSections(laSoSections) &&
        lasoGen.transportError === "gateway_timeout"
      ) {
        toast.error("Luận tổng quan mất quá lâu — thử tải lại luận.");
      }
      if (
        menhTongQuanProseFromSections(laSoSections) &&
        !hasTinhCachLuanFromSections(laSoSections)
      ) {
        const tinhGen = await invokeGenerateReading({
          endpoint: "la-so-chi-tiet",
          data: lasoData,
          only_tinh_cach: true,
        });
        tinhGenTransport = tinhGen.transportError;
        const tinhSections = laSoSectionsFromGenerateReading(
          tinhGen.sections,
          tinhGen.reading,
        );
        if (tinhSections.length > 0) {
          laSoSections = mergeLaSoTinhCachSections(laSoSections, tinhSections);
          reportProgress();
        } else if (tinhGen.transportError === "gateway_timeout") {
          toast.error("Luận tính cách mất quá lâu — thử tải lại luận.");
        }
      }
    })(),
    luuNienResOk
      ? (async () => {
          const lifeGen = await invokeGenerateReading({
            endpoint: "luu-nien",
            data: luuNienFactsRaw,
            only_luu_nien_life: true,
          });
          lifeGenTransport = lifeGen.transportError;
          luuNienSections = mergeLuuNienGenerateSections(
            luuNienSectionsFromGenerateReading(lifeGen.sections, lifeGen.reading),
            luuNienSections,
          );
          reportProgress();
        })()
      : Promise.resolve(),
    luuNienResOk
      ? (async () => {
          const coreGen = await invokeGenerateReading({
            endpoint: "luu-nien",
            data: luuNienFactsRaw,
            only_luu_nien_core: true,
          });
          coreGenTransport = coreGen.transportError;
          luuNienSections = mergeLuuNienGenerateSections(
            luuNienSections,
            luuNienSectionsFromGenerateReading(coreGen.sections, coreGen.reading),
          );
          reportProgress();
        })()
      : Promise.resolve(),
    phongThuyFactsRaw
      ? (async () => {
          const phongThuyGen = await invokeGenerateReading({
            endpoint: "phong-thuy",
            data: phongThuyFactsRaw,
          });
          phongThuySections = phongThuySectionsFromGenerateReading(
            phongThuyFactsRaw,
            phongThuyGen.sections,
            phongThuyGen.reading,
          );
          reportProgress();
        })()
      : Promise.resolve(),
  ]);

  if (!deliveryHasMenhProse(laSoSections)) {
    const menhRetry = await invokeGenerateReading({
      endpoint: "la-so-chi-tiet",
      data: lasoData,
    });
    const retryLaSo = laSoSectionsFromGenerateReading(
      menhRetry.sections,
      menhRetry.reading,
    );
    if (deliveryHasMenhProse(retryLaSo)) {
      const retryIds = new Set(retryLaSo.map((s) => s.id));
      laSoSections = [
        ...retryLaSo,
        ...laSoSections.filter((s) => !retryIds.has(s.id)),
      ];
      reportProgress();
    }
  }

  if (
    luuNienResOk &&
    !hasLuuNienLifeLuanFromSections(luuNienSections, expectedLifeAreas)
  ) {
    if (lifeGenTransport === "gateway_timeout") {
      toast.error("Luận vận năm mất quá lâu — thử tải lại luận.");
    }
    const lifeRetry = await invokeGenerateReading({
      endpoint: "luu-nien",
      data: luuNienFactsRaw,
      only_luu_nien_life: true,
    });
    const retryLife = luuNienSectionsFromGenerateReading(
      lifeRetry.sections,
      lifeRetry.reading,
    );
    if (
      hasLuuNienLifeLuanFromSections(
        mergeLuuNienGenerateSections(retryLife, luuNienSections),
        expectedLifeAreas,
      ) ||
      retryLife.length > 0
    ) {
      luuNienSections = mergeLuuNienGenerateSections(
        retryLife,
        luuNienSections,
      );
      reportProgress();
    }
  }
  if (
    deliveryHasMenhProse(laSoSections) &&
    !hasTinhCachLuanFromSections(laSoSections)
  ) {
    if (tinhGenTransport === "gateway_timeout") {
      toast.error("Luận tính cách mất quá lâu — thử tải lại luận.");
    }
    const tinhRetry = await invokeGenerateReading({
      endpoint: "la-so-chi-tiet",
      data: lasoData,
      only_tinh_cach: true,
    });
    const retryTinh = laSoSectionsFromGenerateReading(
      tinhRetry.sections,
      tinhRetry.reading,
    );
    if (retryTinh.length > 0) {
      laSoSections = mergeLaSoTinhCachSections(laSoSections, retryTinh);
      reportProgress();
    }
  }
  if (luuNienResOk && !hasLuuNienQuyNhanLuanFromSections(luuNienSections)) {
    if (coreGenTransport === "gateway_timeout") {
      toast.error("Luận quý nhân mất quá lâu — thử tải lại luận.");
    }
    const coreRetry = await invokeGenerateReading({
      endpoint: "luu-nien",
      data: luuNienFactsRaw,
      only_luu_nien_core: true,
    });
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
  };

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
