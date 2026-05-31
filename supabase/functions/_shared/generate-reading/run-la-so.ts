import { GENERATE_READING_LA_SO_ENDPOINTS } from "./endpoints.ts";
import { createGenerateReadingHandler } from "./handler/create-handler.ts";
import { generateLaSoReading } from "./generators/la-so.ts";
import {
  laSoChiTietPreviewSections,
  TINH_CACH_INTRO_SECTION_ID,
  TINH_CACH_TRAIT_SECTION_PREFIX,
} from "./parsers/la-so.ts";
import { MIN_TINH_CACH_TRAIT_CHARS } from "./core/config.ts";
import { phongThuyCachedSectionsValid } from "./parsers/phong-thuy.ts";
import type { LaSoChiTietSection } from "./core/types.ts";

function laSoChiTietFullCacheHasTinhCach(sections: LaSoChiTietSection[]): boolean {
  return sections.some((s) => {
    if (s.id === TINH_CACH_INTRO_SECTION_ID) {
      return (s.text?.trim().length ?? 0) >= 80;
    }
    if (s.id.startsWith(TINH_CACH_TRAIT_SECTION_PREFIX)) {
      return (s.text?.trim().length ?? 0) >= MIN_TINH_CACH_TRAIT_CHARS;
    }
    if (s.id === "tinh_cach") {
      return (s.text?.trim().length ?? 0) >= 120;
    }
    return false;
  });
}

/** La-so-domain Edge bundle — lá số chi tiết + prose endpoints only. */
export function createLaSoGenerateReadingHandler() {
  return createGenerateReadingHandler(
    GENERATE_READING_LA_SO_ENDPOINTS,
    generateLaSoReading,
    {
      transformCachedLaSoSections: (sections, preview) =>
        preview ? laSoChiTietPreviewSections(sections) : sections,
      laSoChiTietCachedSectionsValid: laSoChiTietFullCacheHasTinhCach,
      phongThuyCachedSectionsValid,
    },
  );
}
