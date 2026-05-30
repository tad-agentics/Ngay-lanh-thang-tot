/** True when payload is upstream `LuanContextResponse` (not raw day-detail). */
export function isLuanContextPayload(data: unknown): boolean {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const d = data as Record<string, unknown>;
  return (
    Array.isArray(d.breakdown_summary) &&
    typeof d.date_iso === "string" &&
    d.date_iso.trim().length > 0
  );
}
