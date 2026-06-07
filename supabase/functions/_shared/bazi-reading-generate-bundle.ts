/**
 * Shared Bát Tự reading generate orchestration (Deno) — parity with client bundle.
 */
import { baziReadingDeliveryIsComplete } from "../../../shared/bazi-reading-delivery-complete.ts";
import { missingTinhCachTraitIdsFromSections } from "../../../shared/bazi-reading-trait-ids.ts";
import {
  GENERATE_READING_LA_SO_ENDPOINTS,
  GENERATE_READING_LUU_NIEN_ENDPOINTS,
} from "./generate-reading/endpoints.ts";

export type BundleSection = {
  id: string;
  title: string;
  text: string;
};

export type GenerateInvokeResult = {
  sections: BundleSection[];
  reading: string | null;
};

export type BaziGeneratePorts = {
  invokeBatTu: (
    op: string,
    query: Record<string, unknown>,
  ) => Promise<unknown | null>;
  invokeGenerate: (
    functionName: string,
    body: Record<string, unknown>,
  ) => Promise<GenerateInvokeResult | null>;
  /** Optional — retry on 502/503/504 from Edge (default: no retry). */
  invokeGenerateWithRetry?: (
    functionName: string,
    body: Record<string, unknown>,
  ) => Promise<GenerateInvokeResult | null>;
  sleep: (ms: number) => Promise<void>;
};

const MENH_PREVIEW_MAX_ATTEMPTS = 2;
const MENH_WAVE_RETRY_MS = 11_000;
const GAP_FILL_WARM_RETRY_MS = 1_200;

const LUU_NIEN_LIFE_PREFIX = "luu_nien_life_";

function generateFunctionName(endpoint: string): string {
  if (GENERATE_READING_LA_SO_ENDPOINTS.has(endpoint)) {
    return "generate-reading-la-so";
  }
  if (GENERATE_READING_LUU_NIEN_ENDPOINTS.has(endpoint)) {
    return "generate-reading-luu-nien";
  }
  throw new Error(`Unknown generate-reading endpoint: ${endpoint}`);
}

function parseSections(json: Record<string, unknown> | null): BundleSection[] {
  if (!json) return [];
  const raw = json.sections;
  if (!Array.isArray(raw)) return [];
  const out: BundleSection[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const r = row as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id.trim() : "";
    const text = typeof r.text === "string" ? r.text.trim() : "";
    const title = typeof r.title === "string" ? r.title.trim() : id;
    if (!id || !text) continue;
    out.push({ id, title: title || id, text });
  }
  return out;
}

function coalesceSections(
  sections: BundleSection[] | null,
  reading: string | null,
): BundleSection[] {
  if (sections && sections.length > 0) return sections;
  const raw = reading?.trim() ?? "";
  if (!raw) return [];
  return [{ id: "reading", title: "Luận", text: raw }];
}

function mergeById(
  base: BundleSection[],
  incoming: BundleSection[],
): BundleSection[] {
  const byId = new Map(base.map((s) => [s.id, s]));
  for (const s of incoming) byId.set(s.id, s);
  return [...byId.values()];
}

function mergeMenhPreview(
  base: BundleSection[],
  incoming: BundleSection[],
): BundleSection[] {
  if (incoming.length === 0) return base;
  const incomingIds = new Set(incoming.map((s) => s.id));
  return [...incoming, ...base.filter((s) => !incomingIds.has(s.id))];
}

function hasMenhProse(sections: BundleSection[]): boolean {
  const menh = sections.find((s) => s.id === "menh_tong_quan")?.text ?? "";
  return menh.length >= 600;
}

function missingLifeIds(luuFacts: unknown, sections: BundleSection[]): string[] {
  const root =
    luuFacts && typeof luuFacts === "object" && !Array.isArray(luuFacts)
      ? (luuFacts as Record<string, unknown>)
      : null;
  const lifeRaw = root?.life_areas ?? root?.lifeAreas;
  const expected: string[] = [];
  if (Array.isArray(lifeRaw)) {
    for (const item of lifeRaw) {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const o = item as Record<string, unknown>;
        const id =
          typeof o.id === "string"
            ? o.id
            : typeof o.key === "string"
              ? o.key
              : "";
        if (id) expected.push(id);
      }
    }
  }
  if (expected.length === 0) {
    return ["a", "b", "c", "d"].filter(
      (id) =>
        !sections.some(
          (s) => s.id === `${LUU_NIEN_LIFE_PREFIX}${id}` && s.text.length >= 420,
        ),
    );
  }
  const have = new Set(
    sections
      .filter((s) => s.id.startsWith(LUU_NIEN_LIFE_PREFIX) && s.text.length >= 420)
      .map((s) => s.id.slice(LUU_NIEN_LIFE_PREFIX.length)),
  );
  return expected.filter((id) => !have.has(id));
}

function hasQuyNhan(sections: BundleSection[]): boolean {
  const text = sections.find((s) => s.id === "luu_nien_ung_xu")?.text ?? "";
  return text.length >= 720;
}

export type RunBaziGenerateBundleInput = {
  person: Record<string, unknown>;
  year: number;
  ports: BaziGeneratePorts;
};

export type RunBaziGenerateBundleResult = {
  sections: BundleSection[];
  lasoData: unknown;
  luuNienFacts: unknown | null;
  phongThuyFacts: unknown | null;
  complete: boolean;
};

export async function runBaziGenerateBundle(
  input: RunBaziGenerateBundleInput,
): Promise<RunBaziGenerateBundleResult | null> {
  const { person, year, ports } = input;
  const invokeGen = ports.invokeGenerateWithRetry ?? ports.invokeGenerate;

  const [lasoData, luuNienFacts, phongThuyFacts] = await Promise.all([
    ports.invokeBatTu("la-so", person),
    ports.invokeBatTu("la-so-luu-nien", { ...person, year }),
    ports.invokeBatTu("phong-thuy", {
      ...person,
      year,
      purpose: "NHA_O",
      detail: "full",
    }),
  ]);

  if (!lasoData) return null;

  let laSoSections: BundleSection[] = [];
  let luuNienSections: BundleSection[] = [];
  let phongThuySections: BundleSection[] = [];

  const invokeLaSo = (body: Record<string, unknown>) =>
    invokeGen(generateFunctionName("la-so-chi-tiet"), body);
  const invokeLuuNien = (body: Record<string, unknown>) =>
    invokeGen(generateFunctionName("luu-nien"), body);
  const invokePhongThuy = (body: Record<string, unknown>) =>
    invokeGen(generateFunctionName("phong-thuy"), body);

  const mergeAll = () =>
    mergeById(
      mergeById(laSoSections, luuNienSections),
      phongThuySections,
    );

  // Wave 1 — menh preview with retry
  for (let menhAttempt = 0; menhAttempt < MENH_PREVIEW_MAX_ATTEMPTS; menhAttempt++) {
    if (menhAttempt > 0) await ports.sleep(MENH_WAVE_RETRY_MS);
    const menhGen = await invokeLaSo({
      endpoint: "la-so-chi-tiet",
      data: lasoData,
      preview: true,
    });
    if (!menhGen) continue;
    const menhSections = coalesceSections(menhGen.sections, menhGen.reading);
    laSoSections = mergeMenhPreview(laSoSections, menhSections);
    if (hasMenhProse(laSoSections)) break;
  }

  // Wave 2 — tinh + life parallel
  const [tinhGen, lifeGen] = await Promise.all([
    invokeLaSo({
      endpoint: "la-so-chi-tiet",
      data: lasoData,
      only_tinh_cach: true,
    }),
    luuNienFacts
      ? invokeLuuNien({
          endpoint: "luu-nien",
          data: luuNienFacts,
          only_luu_nien_life: true,
        })
      : Promise.resolve(null),
  ]);

  if (tinhGen) {
    laSoSections = mergeById(
      laSoSections,
      coalesceSections(tinhGen.sections, tinhGen.reading),
    );
  }
  if (lifeGen) {
    luuNienSections = mergeById(
      luuNienSections,
      coalesceSections(lifeGen.sections, lifeGen.reading),
    );
  }

  if (phongThuyFacts) {
    const ptGen = await invokePhongThuy({
      endpoint: "phong-thuy",
      data: phongThuyFacts,
    });
    if (ptGen) {
      phongThuySections = coalesceSections(ptGen.sections, ptGen.reading);
    }
  }

  if (luuNienFacts) {
    const coreGen = await invokeLuuNien({
      endpoint: "luu-nien",
      data: luuNienFacts,
      only_luu_nien_core: true,
    });
    if (coreGen) {
      luuNienSections = mergeById(
        luuNienSections,
        coalesceSections(coreGen.sections, coreGen.reading),
      );
    }
  }

  // Gap-fill traits
  for (const traitId of missingTinhCachTraitIdsFromSections(lasoData, laSoSections)) {
    let retry: BundleSection[] = [];
    for (let attempt = 0; attempt < 2 && retry.length === 0; attempt++) {
      if (attempt > 0) await ports.sleep(GAP_FILL_WARM_RETRY_MS);
      const gen = await invokeLaSo({
        endpoint: "la-so-chi-tiet",
        data: lasoData,
        only_tinh_cach: true,
        tinh_cach_trait_ids: [traitId],
      });
      if (gen) retry = coalesceSections(gen.sections, gen.reading);
    }
    if (retry.length > 0) {
      laSoSections = mergeById(laSoSections, retry);
    }
  }

  // Gap-fill life areas
  if (luuNienFacts) {
    for (const areaId of missingLifeIds(luuNienFacts, luuNienSections)) {
      let retry: BundleSection[] = [];
      for (let attempt = 0; attempt < 2 && retry.length === 0; attempt++) {
        if (attempt > 0) await ports.sleep(GAP_FILL_WARM_RETRY_MS);
        const gen = await invokeLuuNien({
          endpoint: "luu-nien",
          data: luuNienFacts,
          only_luu_nien_life: true,
          luu_nien_life_area_ids: [areaId],
        });
        if (gen) retry = coalesceSections(gen.sections, gen.reading);
      }
      if (retry.length > 0) {
        luuNienSections = mergeById(luuNienSections, retry);
      }
    }

    if (!hasQuyNhan(luuNienSections)) {
      const coreRetry = await invokeLuuNien({
        endpoint: "luu-nien",
        data: luuNienFacts,
        only_luu_nien_core: true,
      });
      if (coreRetry) {
        luuNienSections = mergeById(
          luuNienSections,
          coalesceSections(coreRetry.sections, coreRetry.reading),
        );
      }
    }
  }

  if (phongThuyFacts) {
    const mergedBeforePhongRetry = mergeAll();
    const needsPhongRetry =
      baziReadingDeliveryIsComplete(mergedBeforePhongRetry, {
        luuNienFactsRaw: luuNienFacts,
        phongThuyFactsRaw: null,
      }) &&
      !baziReadingDeliveryIsComplete(mergedBeforePhongRetry, {
        luuNienFactsRaw: luuNienFacts,
        phongThuyFactsRaw: phongThuyFacts,
      });
    if (needsPhongRetry) {
      const phongRetry = await invokePhongThuy({
        endpoint: "phong-thuy",
        data: phongThuyFacts,
      });
      if (phongRetry) {
        phongThuySections = coalesceSections(
          phongRetry.sections,
          phongRetry.reading,
        );
      }
    }
  }

  const sections = mergeAll();
  const complete = baziReadingDeliveryIsComplete(sections, {
    luuNienFactsRaw: luuNienFacts,
    phongThuyFactsRaw: phongThuyFacts,
  });

  return {
    sections,
    lasoData,
    luuNienFacts: luuNienFacts ?? null,
    phongThuyFacts: phongThuyFacts ?? null,
    complete,
  };
}
