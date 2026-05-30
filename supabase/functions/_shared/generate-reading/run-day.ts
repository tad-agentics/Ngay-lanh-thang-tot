import { GENERATE_READING_DAY_ENDPOINTS } from "./endpoints.ts";
import { createGenerateReadingHandler } from "./handler/create-handler.ts";
import { generateDayReading } from "./generators/day.ts";

/** Day-domain Edge bundle — prompts/parsers for ngày, chọn ngày, hợp tuổi only. */
export function createDayGenerateReadingHandler() {
  return createGenerateReadingHandler(
    GENERATE_READING_DAY_ENDPOINTS,
    generateDayReading,
  );
}
