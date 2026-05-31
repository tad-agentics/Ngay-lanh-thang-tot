import { GENERATE_READING_LUU_NIEN_ENDPOINTS } from "./endpoints.ts";
import { createGenerateReadingHandler } from "./handler/create-handler.ts";
import { generateLuuNienReading } from "./generators/luu-nien.ts";
import { luuNienCachedSectionsValid } from "./parsers/luu-nien-core.ts";

/** Lưu niên (vận năm) — `generate-reading-luu-nien`. */
export function createLuuNienGenerateReadingHandler() {
  return createGenerateReadingHandler(
    GENERATE_READING_LUU_NIEN_ENDPOINTS,
    generateLuuNienReading,
    {
      cachedSectionsValid: (sections) => luuNienCachedSectionsValid(sections),
    },
  );
}
