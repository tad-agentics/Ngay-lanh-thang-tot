import { GENERATE_READING_LA_SO_ENDPOINTS } from "./endpoints.ts";
import { createGenerateReadingHandler } from "./handler/create-handler.ts";
import { generateLaSoReading } from "./generators/la-so.ts";
import {
  laSoChiTietPreviewSections,
  menhTongQuanProseTooShort,
} from "./parsers/la-so.ts";
import {
  phongThuyAllBlocksCachedValid,
  phongThuyCachedSectionsValid,
} from "./parsers/phong-thuy.ts";
import type { LaSoChiTietSection } from "./core/types.ts";

/** Full `la-so-chi-tiet` cache — chỉ cần §01; §02 có cache key `only-tinh-cach` riêng. */
function laSoChiTietFullCacheIsValid(sections: LaSoChiTietSection[]): boolean {
  const menh = sections.find((s) => s.id === "menh_tong_quan");
  if (!menh?.text?.trim()) return false;
  return !menhTongQuanProseTooShort(menh.text);
}

/** La-so-domain Edge bundle — lá số chi tiết + prose endpoints only. */
export function createLaSoGenerateReadingHandler() {
  return createGenerateReadingHandler(
    GENERATE_READING_LA_SO_ENDPOINTS,
    generateLaSoReading,
    {
      transformCachedLaSoSections: (sections, preview) =>
        preview ? laSoChiTietPreviewSections(sections) : sections,
      laSoChiTietCachedSectionsValid: laSoChiTietFullCacheIsValid,
      phongThuyCachedSectionsValid,
      phongThuyAllBlocksCachedValid,
    },
  );
}
