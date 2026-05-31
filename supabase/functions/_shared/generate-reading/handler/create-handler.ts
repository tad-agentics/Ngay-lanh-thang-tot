import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { requireBaziReadingAuth } from "../../bazi-reading-gate.ts";
import { buildDayLuanPromptContext } from "../../day-luan-prompt-context.ts";
import {
  acquireGenerateReadingRateLimit,
  preflightAiReadingAccess,
} from "../../generate-reading-guards.ts";
import { isLuanContextPayload } from "../../luan-context.ts";
import { corsHeadersForRequest } from "../../cors.ts";
import {
  endpointCacheVersion,
  GLOBAL_LLM_VER,
} from "../core/cache-versions.ts";
import {
  parseAnchorReading,
  parseThreadHistory,
} from "../core/thread-history.ts";
import { readCachedBody, sha256Prefix16, stableStringify } from "../core/cache.ts";
import { MAX_BODY_CHARS } from "../core/config.ts";
import { dayIsoFromDayDetailData, todayIsoVietnam } from "../core/dates.ts";
import { ok } from "../core/response.ts";
import type { GenerateReadingFn, LaSoChiTietSection } from "../core/types.ts";

export type GenerateReadingHandlerOptions = {
  /** La-so-chi-tiet cache: trim sections for preview paywall. */
  transformCachedLaSoSections?: (
    sections: LaSoChiTietSection[],
    preview: boolean,
  ) => LaSoChiTietSection[];
  /** Tieu-van / luu-nien cache: reject sections that are too short. */
  cachedSectionsValid?: (sections: LaSoChiTietSection[]) => boolean;
  /** @deprecated Use cachedSectionsValid */
  tieuVanCachedSectionsValid?: (sections: LaSoChiTietSection[]) => boolean;
};

export function createGenerateReadingHandler(
  allowedEndpoints: ReadonlySet<string> | null,
  generate: GenerateReadingFn,
  options: GenerateReadingHandlerOptions = {},
) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeadersForRequest(req) });
    }

    if (req.method !== "POST") {
      return ok(null, null, req);
    }

    let parsed: unknown;
    try {
      parsed = await req.json();
    } catch {
      return ok(null, null, req);
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return ok(null, null, req);
    }

    const body = parsed as Record<string, unknown>;
    const endpoint =
      typeof body.endpoint === "string" ? body.endpoint.trim() : "";
    const data = body.data;
    const question =
      typeof body.question === "string" ? body.question.trim().slice(0, 500) : "";
    const variant =
      body.variant === "inline"
        ? "inline"
        : body.variant === "teaser"
          ? "teaser"
          : "";
    const preview = body.preview === true;
    const anchorReading = parseAnchorReading(body.anchor_reading);
    const threadHistory = parseThreadHistory(body.thread_history);

    if (!endpoint || data === undefined) {
      return ok(null, null, req);
    }

    if (allowedEndpoints !== null && !allowedEndpoints.has(endpoint)) {
      return ok(null, null, req);
    }

    if (data !== null && typeof data !== "object") {
      return ok(null, null, req);
    }

    /** Follow-up Q/A for day-detail lives in `day-luan-chat` Edge (server thread). */
    if (endpoint === "day-detail" && question) {
      console.warn(
        "generate-reading day-detail question deprecated; use day-luan-chat",
      );
      return ok(null, null, req);
    }

    let rateLimitUserId: string | null = null;

    if (endpoint === "ngay-hom-nay" || endpoint === "day-detail") {
      const gateUrl = Deno.env.get("SUPABASE_URL");
      const gateAnon = Deno.env.get("SUPABASE_ANON_KEY");
      const gateService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      const authHeader = req.headers.get("Authorization");
      if (!gateUrl || !gateAnon || !gateService || !authHeader?.startsWith("Bearer ")) {
        return ok(null, null, req);
      }
      const userClient = createClient(gateUrl, gateAnon, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: userErr } = await userClient.auth.getUser();
      const uid = userData?.user?.id;
      if (userErr || !uid) {
        return ok(null, null, req);
      }
      if (variant === "teaser") {
        const adminGate = createClient(gateUrl, gateService);
        const { data: teaserProfile, error: teaserProfErr } = await adminGate
          .from("profiles")
          .select("subscription_expires_at")
          .eq("id", uid)
          .maybeSingle();
        if (
          teaserProfErr ||
          !teaserProfile ||
          teaserProfile.subscription_expires_at != null
        ) {
          console.warn(
            "generate-reading teaser denied",
            endpoint,
            uid,
            teaserProfErr?.message ?? "not_never_subscribed",
          );
          return ok(null, null, req);
        }
        if (endpoint === "day-detail") {
          const dayIso = dayIsoFromDayDetailData(data);
          if (!dayIso) {
            return ok(null, null, req);
          }
        }
        rateLimitUserId = uid;
      } else {
        const dayIso =
          endpoint === "ngay-hom-nay"
            ? todayIsoVietnam()
            : dayIsoFromDayDetailData(data);
        if (!dayIso) {
          return ok(null, null, req);
        }
        const scope = endpoint === "ngay-hom-nay" ? "home" : "day_detail";
        const adminGate = createClient(gateUrl, gateService);
        const preflight = await preflightAiReadingAccess(
          adminGate,
          uid,
          scope,
          dayIso,
        );
        if (!preflight.allowed) {
          console.warn(
            "generate-reading preflight denied",
            endpoint,
            preflight.reason,
            uid,
          );
          return ok(null, null, req);
        }
        rateLimitUserId = uid;
      }
    }

    if (
      endpoint === "la-so-chi-tiet" ||
      endpoint === "luu-nien" ||
      endpoint === "phong-thuy"
    ) {
      const auth = await requireBaziReadingAuth(req, {
        allowWithoutEntitlement: endpoint === "la-so-chi-tiet" && preview,
      });
      if (!auth) return ok(null, null, req);
      rateLimitUserId = auth.uid;
    }

    const promptBody: Record<string, unknown> =
      endpoint === "day-detail" && data !== null && typeof data === "object"
        ? {
            endpoint: "day-detail",
            luan_context: isLuanContextPayload(data)
              ? data
              : buildDayLuanPromptContext(data),
            ...(question ? { question } : {}),
            ...(variant === "inline" ? { variant: "inline" } : {}),
          }
        : {
            endpoint,
            data,
            ...(question ? { question } : {}),
            ...(variant === "inline" ? { variant: "inline" } : {}),
          };

    const dataJson = stableStringify(
      endpoint === "day-detail" && data !== null && typeof data === "object"
        ? (promptBody.luan_context as unknown)
        : data,
    );
    const endpointVer = endpointCacheVersion(endpoint, {
      preview,
      question,
      variant,
    });
    const threadJson = threadHistory.length
      ? stableStringify(threadHistory)
      : "";
    const cacheInput = `${GLOBAL_LLM_VER}\n${endpointVer}\n${endpoint}\n${variant}\n${question}\n${preview ? "preview" : ""}\n${threadJson}\n${anchorReading ? await sha256Prefix16(anchorReading.slice(0, 4000)) : ""}\n${dataJson}`;
    const cacheKey = await sha256Prefix16(cacheInput);

    const payload = stableStringify(promptBody);
    if (payload.length > MAX_BODY_CHARS) {
      return ok(null, null, req);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const now = Date.now();
    const admin =
      supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

    if (admin) {
      const { data: row, error: readErr } = await admin
        .from("reading_cache")
        .select("reading, expires_at")
        .eq("cache_key", cacheKey)
        .maybeSingle();

      if (!readErr && row && typeof row.reading === "string") {
        const exp = row.expires_at as string;
        if (new Date(exp).getTime() > now) {
          const cached = readCachedBody(endpoint, row.reading);
          if (endpoint === "la-so-chi-tiet") {
            if (cached.sections != null && cached.sections.length > 0) {
              const out = options.transformCachedLaSoSections
                ? options.transformCachedLaSoSections(cached.sections, preview)
                : cached.sections;
              return ok(null, out, req);
            }
            await admin.from("reading_cache").delete().eq("cache_key", cacheKey);
          } else if (endpoint === "tieu-van" || endpoint === "luu-nien") {
            if (cached.sections != null && cached.sections.length > 0) {
              const validate =
                options.cachedSectionsValid ??
                options.tieuVanCachedSectionsValid;
              const valid = validate?.(cached.sections) ?? true;
              if (valid) {
                return ok(null, cached.sections, req);
              }
              await admin.from("reading_cache").delete().eq("cache_key", cacheKey);
            }
            const r = cached.reading?.trim() ?? "";
            if (r.length > 0) return ok(r, null, req);
            await admin.from("reading_cache").delete().eq("cache_key", cacheKey);
          } else if (endpoint === "chon-ngay-cards") {
            if (
              cached.dayReadings != null &&
              Object.keys(cached.dayReadings).length > 0
            ) {
              return ok(null, null, req, cached.dayReadings);
            }
            await admin.from("reading_cache").delete().eq("cache_key", cacheKey);
          } else {
            const r = cached.reading?.trim() ?? "";
            if (r.length > 0) return ok(r, null, req);
            await admin.from("reading_cache").delete().eq("cache_key", cacheKey);
          }
        }
      }
    }

    if (rateLimitUserId) {
      const slot = await acquireGenerateReadingRateLimit(rateLimitUserId, {
        followUp: question.length > 0,
      });
      if (!slot) {
        console.warn(
          "generate-reading rate limited",
          rateLimitUserId,
          question ? "follow-up" : "primary",
        );
        return ok(null, null, req);
      }
    }

    const result = await generate({
      req,
      endpoint,
      data,
      question,
      variant,
      preview,
      promptBody,
      payload,
      cacheKey,
      admin,
      now,
      anchorReading,
      threadHistory,
    });

    return ok(
      result.reading,
      result.sections,
      req,
      result.dayReadings,
    );
  };
}
