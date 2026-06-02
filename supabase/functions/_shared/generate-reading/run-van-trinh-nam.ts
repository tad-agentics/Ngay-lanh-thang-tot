import { GENERATE_READING_VAN_TRINH_NAM_ENDPOINTS } from "./endpoints.ts";
import { createGenerateReadingHandler } from "./handler/create-handler.ts";
import { generateVanTrinhNamReading } from "./generators/van-trinh-nam.ts";
import { vanTrinhNamSectionsNeedLengthRetry } from "./parsers/van-trinh-nam.ts";

export function createVanTrinhNamGenerateReadingHandler() {
  return createGenerateReadingHandler(
    GENERATE_READING_VAN_TRINH_NAM_ENDPOINTS,
    generateVanTrinhNamReading,
    {
      cachedSectionsValid: (sections) =>
        !vanTrinhNamSectionsNeedLengthRetry(sections),
    },
  );
}
