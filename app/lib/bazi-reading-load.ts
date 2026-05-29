import { toast } from "sonner";

import type { Profile } from "~/lib/profile-context";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import {
  invokeGenerateReading,
  normalizeLaSoSectionsInput,
  type LaSoChiTietSection,
} from "~/lib/generate-reading";
import { fetchLuuNienYearFacts } from "~/lib/luu-nien-facts";
import {
  luuNienSectionsFromGenerateReading,
  mergeLaSoWithLuuNienSections,
} from "~/lib/luu-nien-ui";
import { fetchPhongThuyYearFacts } from "~/lib/phong-thuy-facts";
import {
  mergeBaziReadingWithPhongThuy,
  phongThuySectionsFromGenerateReading,
} from "~/lib/phong-thuy-ui";

export const BAZI_READING_SECTION_ORDER: LaSoChiTietSection["id"][] = [
  "tinh_cach",
  "su_nghiep",
  "tai_van",
  "suc_khoe",
  "tinh_duyen",
];

export const BAZI_READING_SECTION_TITLES: Record<string, string> = {
  tinh_cach: "Tính cách",
  su_nghiep: "Sự nghiệp",
  tai_van: "Tài vận",
  suc_khoe: "Sức khỏe",
  tinh_duyen: "Tình duyên",
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

/** Chỉ lá số + Gemini `la-so-chi-tiet` (dùng cho paywall preview). */
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

export async function loadBaziReadingSections(
  profile: Profile,
  year: number,
): Promise<LaSoChiTietSection[]> {
  const body = profileToBatTuPersonQuery(profile);
  if (!body.birth_date) return [];

  const [lasoRes, luuNienRes, phongThuyRes] = await Promise.all([
    invokeBatTu<unknown>({ op: "la-so", body }),
    fetchLuuNienYearFacts(profile, year),
    fetchPhongThuyYearFacts(profile, year),
  ]);

  if (!lasoRes.ok) {
    toast.error(lasoRes.message ?? "Không tải lá số.");
    return [];
  }

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
  return mergeBaziReadingWithPhongThuy(withLuuNien, phongThuySections);
}
