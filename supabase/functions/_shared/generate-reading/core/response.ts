import { corsHeadersForRequest } from "../../cors.ts";
import type { LaSoChiTietSection } from "./types.ts";

export function ok(
  reading: string | null,
  sections: LaSoChiTietSection[] | null | undefined,
  req: Request,
  dayReadings?: Record<string, string> | null,
): Response {
  const body: Record<string, unknown> = { reading: reading ?? null };
  if (sections != null && sections.length > 0) body.sections = sections;
  if (dayReadings != null && Object.keys(dayReadings).length > 0) {
    body.day_readings = dayReadings;
  }
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      ...corsHeadersForRequest(req),
      "Content-Type": "application/json",
    },
  });
}
