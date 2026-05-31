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
  menhTongQuanProseFromSections,
  type BaziDisplayChapter,
} from "~/lib/bazi-reading-outline";
import {
  invokeGenerateReading,
  normalizeLaSoSectionsInput,
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
} from "~/lib/luu-nien-ui";
import { fetchPhongThuyYearFacts } from "~/lib/phong-thuy-facts";
import {
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
  return menhTongQuanProseFromSections(sections).length > 0;
}

function deliveryHasFullLuanSections(
  sections: LaSoChiTietSection[],
  luuNienFactsRaw?: unknown | null,
): boolean {
  const facts = luuNienFactsRaw ? parseLuuNienFactsView(luuNienFactsRaw) : null;
  const expected = Math.max(1, facts?.lifeAreas.length ?? 4);
  return (
    deliveryHasMenhProse(sections) &&
    hasTinhCachLuanFromSections(sections) &&
    hasLuuNienLifeLuanFromSections(sections, expected)
  );
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
      deliveryHasFullLuanSections(stored.sections, stored.luu_nien_facts)
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

  const lasoGen = await invokeGenerateReading({
    endpoint: "la-so-chi-tiet",
    data: lasoData,
  });

  let laSoSections = laSoSectionsFromGenerateReading(
    lasoGen.sections,
    lasoGen.reading,
  );
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
    const tinhSections = laSoSectionsFromGenerateReading(
      tinhGen.sections,
      tinhGen.reading,
    );
    if (tinhSections.length > 0) {
      laSoSections = mergeLaSoTinhCachSections(laSoSections, tinhSections);
    } else if (tinhGen.transportError === "gateway_timeout") {
      toast.error("Luận tính cách mất quá lâu — thử tải lại luận.");
    }
  }

  const [luuNienGen, phongThuyGen] = await Promise.all([
    luuNienResOk
      ? invokeGenerateReading({
          endpoint: "luu-nien",
          data: luuNienFactsRaw,
        })
      : Promise.resolve({ reading: null, sections: null, dayReadings: null }),
    phongThuyFactsRaw
      ? invokeGenerateReading({
          endpoint: "phong-thuy",
          data: phongThuyFactsRaw,
        })
      : Promise.resolve({ reading: null, sections: null, dayReadings: null }),
  ]);

  let luuNienSections = luuNienSectionsFromGenerateReading(
    luuNienGen.sections,
    luuNienGen.reading,
  );
  if (
    luuNienResOk &&
    !hasLuuNienLifeLuanFromSections(luuNienSections, expectedLifeAreas)
  ) {
    if (luuNienGen.transportError === "gateway_timeout") {
      toast.error("Luận vận năm mất quá lâu — thử tải lại luận.");
    }
    const luuRetry = await invokeGenerateReading({
      endpoint: "luu-nien",
      data: luuNienFactsRaw,
    });
    const retrySections = luuNienSectionsFromGenerateReading(
      luuRetry.sections,
      luuRetry.reading,
    );
    if (
      hasLuuNienLifeLuanFromSections(retrySections, expectedLifeAreas) ||
      retrySections.length > luuNienSections.length
    ) {
      luuNienSections = retrySections;
    }
  }
  const phongThuySections = phongThuySectionsFromGenerateReading(
    phongThuyFactsRaw,
    phongThuyGen.reading,
  );

  const withLuuNien = mergeLaSoWithLuuNienSections(laSoSections, luuNienSections);
  const sections = mergeBaziReadingWithPhongThuy(withLuuNien, phongThuySections);

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
    deliveryHasFullLuanSections(sections, luuNienFactsRaw) &&
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
