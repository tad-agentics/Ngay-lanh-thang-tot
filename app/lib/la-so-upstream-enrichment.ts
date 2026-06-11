import { normalizeLaSoPayload } from "~/lib/la-so-normalize";
import { extractLaSoChiTietEnrichment } from "~/lib/la-so-ui-chi-tiet-core";

/** Chuẩn hóa payload GET /v1/la-so hoặc POST /v1/tu-tru cho merge hiển thị. */
export function enrichmentFromLaSoUpstream(
  upstream: unknown,
): Record<string, unknown> | null {
  const extracted = extractLaSoChiTietEnrichment(upstream);
  const normalized = normalizeLaSoPayload(upstream);
  if (
    normalized != null &&
    typeof normalized === "object" &&
    !Array.isArray(normalized)
  ) {
    const layer = normalized as Record<string, unknown>;
    if (extracted && Object.keys(extracted).length > 0) {
      return { ...layer, ...extracted };
    }
    return layer;
  }
  return extracted;
}
