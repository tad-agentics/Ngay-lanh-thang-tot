import { laSoMatchesBatTuBody } from "./la-so-birth-identity.ts";
import { laSoPillarsMatch } from "./la-so-pillar-identity.ts";

/** Có cần xóa `bazi_reading_deliveries` sau khi persist lá số mới. */
export function shouldInvalidateBaziReadingDeliveries(
  previousLaSo: unknown,
  newLaSo: unknown,
  batTuBody: Record<string, unknown>,
): boolean {
  if (previousLaSo == null) return false;
  if (!laSoMatchesBatTuBody(previousLaSo, batTuBody)) return true;
  if (!laSoPillarsMatch(previousLaSo, newLaSo)) return true;
  return false;
}
