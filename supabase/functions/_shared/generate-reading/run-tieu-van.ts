import { GENERATE_READING_TIEU_VAN_ENDPOINTS } from "./endpoints.ts";
import { createGenerateReadingHandler } from "./handler/create-handler.ts";
import { generateTieuVanReading } from "./generators/tieu-van.ts";
import { tieuVanSectionsNeedLengthRetry } from "./parsers/tieu-van.ts";

/** Tiểu vận / lưu niên Edge bundle — JSON 3-part prompts only. */
export function createTieuVanGenerateReadingHandler() {
  return createGenerateReadingHandler(
    GENERATE_READING_TIEU_VAN_ENDPOINTS,
    generateTieuVanReading,
    {
      tieuVanCachedSectionsValid: (sections) =>
        !tieuVanSectionsNeedLengthRetry(sections),
    },
  );
}
