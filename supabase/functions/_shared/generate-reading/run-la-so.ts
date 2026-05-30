import { GENERATE_READING_LA_SO_ENDPOINTS } from "./endpoints.ts";
import { createGenerateReadingHandler } from "./handler/create-handler.ts";
import { generateLaSoReading } from "./generators/la-so.ts";
import { laSoChiTietPreviewSections } from "./parsers/la-so.ts";

/** La-so-domain Edge bundle — lá số chi tiết + prose endpoints only. */
export function createLaSoGenerateReadingHandler() {
  return createGenerateReadingHandler(
    GENERATE_READING_LA_SO_ENDPOINTS,
    generateLaSoReading,
    {
      transformCachedLaSoSections: (sections, preview) =>
        preview ? laSoChiTietPreviewSections(sections) : sections,
    },
  );
}
