import { corsHeadersForRequest } from "../../cors.ts";
import type { LaSoChiTietSection } from "./types.ts";

/** @deprecated Prefer `ok(null, null, req)` — client retries empty 200 bodies. */
export function rateLimited(req: Request): Response {
  return new Response(
    JSON.stringify({
      reading: null,
      error: { code: "RATE_LIMIT_UNAVAILABLE", message: "Thử lại sau vài giây." },
    }),
    {
      status: 200,
      headers: {
        ...corsHeadersForRequest(req),
        "Content-Type": "application/json",
      },
    },
  );
}

export function dailyLimited(
  req: Request,
  followUpCount: number,
): Response {
  return new Response(
    JSON.stringify({
      reading: null,
      error: {
        code: "DAILY_LIMIT",
        message: "Hết lượt hỏi hôm nay.",
        follow_up_count: followUpCount,
        follow_up_remaining: 0,
      },
    }),
    {
      status: 429,
      headers: {
        ...corsHeadersForRequest(req),
        "Content-Type": "application/json",
      },
    },
  );
}

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
