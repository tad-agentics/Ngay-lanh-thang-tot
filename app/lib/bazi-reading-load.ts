import { toast } from "sonner";

import type { LaSoJson } from "~/lib/api-types";
import type { Profile } from "~/lib/profile-context";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import {
  fallbackFlowYearCanChiLabel,
  flowYearCanChiFromFacts,
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

export type BaziReadingLoadResult = {
  sections: LaSoChiTietSection[];
  laSoDisplay: LaSoJson | null;
  luuNienFactsRaw: unknown | null;
  phongThuyFactsRaw: unknown | null;
  yearCanChi: string;
};

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

/** Lá số hiển thị §01 paywall — `la-so` không gate; gộp enrichment khi có. */
export async function loadBaziPaywallLaSoDisplay(
  profile: Profile,
): Promise<LaSoJson | null> {
  const cached = (profile.la_so as LaSoJson) ?? null;
  const body = profileToBatTuPersonQuery(profile);
  if (!body.birth_date) return cached;

  const lasoRes = await invokeBatTu<unknown>({ op: "la-so", body });
  if (!lasoRes.ok) return cached;

  const enrichment = extractLaSoChiTietEnrichment(lasoRes.data);
  return (
    mergeLaSoJsonForChiTietDisplay(cached, enrichment) ?? cached
  );
}

/** Chỉ lá số + Gemini `la-so-chi-tiet` (paywall preview §02). */
export async function loadBaziLaSoChiTietSections(
  profile: Profile,
  options?: { preview?: boolean },
): Promise<LaSoChiTietSection[]> {
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
    ...(options?.preview ? { preview: true } : {}),
  });

  return laSoSectionsFromGenerateReading(gen.sections, gen.reading);
}

/** Full load: facts + Gemini cho màn 18 đã mở khóa. */
export async function loadBaziReadingFull(
  profile: Profile,
  year: number,
): Promise<BaziReadingLoadResult> {
  const empty: BaziReadingLoadResult = {
    sections: [],
    laSoDisplay: (profile.la_so as LaSoJson) ?? null,
    luuNienFactsRaw: null,
    phongThuyFactsRaw: null,
    yearCanChi: fallbackFlowYearCanChiLabel(year) || "",
  };

  const body = profileToBatTuPersonQuery(profile);
  if (!body.birth_date) return empty;

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
  const yearCanChi = resolveYearCanChi(year, luuNienFactsRaw);

  const [lasoGen, luuNienGen, phongThuyGen] = await Promise.all([
    invokeGenerateReading({
      endpoint: "la-so-chi-tiet",
      data: lasoRes.data,
    }),
    luuNienRes.ok
      ? invokeGenerateReading({
          endpoint: "luu-nien",
          data: luuNienRes.data,
        })
      : Promise.resolve({ reading: null, sections: null, dayReadings: null }),
    phongThuyRes.ok
      ? invokeGenerateReading({
          endpoint: "phong-thuy",
          data: phongThuyRes.data,
        })
      : Promise.resolve({ reading: null, sections: null, dayReadings: null }),
  ]);

  const laSoSections = laSoSectionsFromGenerateReading(
    lasoGen.sections,
    lasoGen.reading,
  );
  const luuNienSections = luuNienSectionsFromGenerateReading(
    luuNienGen.sections,
    luuNienGen.reading,
  );
  const phongThuySections = phongThuySectionsFromGenerateReading(
    phongThuyRes.ok ? phongThuyRes.data : null,
    phongThuyGen.reading,
  );

  const withLuuNien = mergeLaSoWithLuuNienSections(laSoSections, luuNienSections);
  const sections = mergeBaziReadingWithPhongThuy(withLuuNien, phongThuySections);

  return {
    sections,
    laSoDisplay,
    luuNienFactsRaw,
    phongThuyFactsRaw,
    yearCanChi,
  };
}

/** @deprecated Use `loadBaziReadingFull` — giữ cho session cache. */
export async function loadBaziReadingSections(
  profile: Profile,
  year: number,
): Promise<LaSoChiTietSection[]> {
  const full = await loadBaziReadingFull(profile, year);
  return full.sections;
}
