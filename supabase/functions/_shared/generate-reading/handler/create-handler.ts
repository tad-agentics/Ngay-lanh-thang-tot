import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { requireBaziReadingAuth } from "../../bazi-reading-gate.ts";
import { requireTieuVanReadingAuth } from "../../tieu-van-reading-gate.ts";
import { buildDayLuanPromptContext } from "../../day-luan-prompt-context.ts";
import {
  acquireGenerateReadingRateLimit,
  generateReadingRateLimitScope,
  preflightAiReadingAccess,
} from "../../generate-reading-guards.ts";
import { isLuanContextPayload } from "../../luan-context.ts";
import { isCalendarTeaserEligible } from "../../entitlements.ts";
import { corsHeadersForRequest } from "../../cors.ts";
import { trackProfileEngagement } from "../../user-engagement.ts";
import {
  endpointCacheVersion,
  GLOBAL_LLM_VER,
} from "../core/cache-versions.ts";
import {
  parseAnchorReading,
  parseThreadHistory,
} from "../core/thread-history.ts";
import { tryReadingCacheHit } from "../core/cache-persist.ts";
import { sha256Prefix16, stableStringify } from "../core/cache.ts";
import { MAX_BODY_CHARS } from "../core/config.ts";
import { dayIsoFromDayDetailData, todayIsoVietnam } from "../core/dates.ts";
import { ok } from "../core/response.ts";
import type { GenerateReadingFn, LaSoChiTietSection } from "../core/types.ts";

function parseStringIdArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((x) => x.trim().toLowerCase());
}

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
  /** Full `la-so-chi-tiet` cache must include §02 traits (not chỉ menh + aspects). */
  laSoChiTietCachedSectionsValid?: (sections: LaSoChiTietSection[]) => boolean;
  /** `la-so-chi-tiet` + `only_tinh_cach`. */
  tinhCachCachedSectionsValid?: (sections: LaSoChiTietSection[]) => boolean;
  /** `luu-nien` + `only_luu_nien_life`. */
  luuNienLifeCachedSectionsValid?: (sections: LaSoChiTietSection[]) => boolean;
  /** `luu-nien` + `only_luu_nien_core`. */
  luuNienCoreCachedSectionsValid?: (sections: LaSoChiTietSection[]) => boolean;
  /** `phong-thuy` — 3 khối sections. */
  phongThuyCachedSectionsValid?: (sections: LaSoChiTietSection[]) => boolean;
  /** `phong-thuy` — đủ 3 khối mới trả cache sớm. */
  phongThuyAllBlocksCachedValid?: (sections: LaSoChiTietSection[]) => boolean;
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
    const onlyTinhCach =
      endpoint === "la-so-chi-tiet" && body.only_tinh_cach === true;
    const onlyLuuNienLife =
      endpoint === "luu-nien" && body.only_luu_nien_life === true;
    const onlyLuuNienCore =
      endpoint === "luu-nien" && body.only_luu_nien_core === true;
    const onlyVanTrinhA =
      endpoint === "van-trinh-nam" && body.only_van_trinh_a === true;
    const onlyVanTrinhC =
      endpoint === "van-trinh-nam" && body.only_van_trinh_c === true;
    const vanTrinhMonthNum =
      endpoint === "van-trinh-nam" && typeof body.month_num === "number"
        ? body.month_num
        : endpoint === "van-trinh-nam" && body.month_num != null
          ? Number(body.month_num)
          : 0;
    const flowYear =
      typeof body.flow_year === "number"
        ? body.flow_year
        : Number(body.flow_year) || 0;
    if (onlyLuuNienLife && onlyLuuNienCore) {
      console.warn(
        "generate-reading: only_luu_nien_life and only_luu_nien_core are mutually exclusive",
      );
      return ok(null, null, req);
    }
    const anchorReading = parseAnchorReading(body.anchor_reading);
    const threadHistory = parseThreadHistory(body.thread_history);

    const tinhCachTraitIds = parseStringIdArray(body.tinh_cach_trait_ids);
    const luuNienLifeAreaIds = parseStringIdArray(body.luu_nien_life_area_ids);

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

    if (endpoint === "tieu-van") {
      const auth = await requireTieuVanReadingAuth(req);
      if (!auth) {
        console.warn("generate-reading tieu-van auth denied");
        return ok(null, null, req);
      }
      rateLimitUserId = auth.uid;
      trackProfileEngagement(auth.admin, auth.uid, "tieu_van_luan");
    }

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
      const adminGate = createClient(gateUrl, gateService);
      const bodyDayIso =
        typeof body.day_iso === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(body.day_iso.trim())
          ? body.day_iso.trim()
          : null;
      const dayIso =
        endpoint === "ngay-hom-nay"
          ? todayIsoVietnam()
          : dayIsoFromDayDetailData(data) ?? bodyDayIso;

      if (variant === "teaser") {
        const { data: teaserProfile, error: teaserProfErr } = await adminGate
          .from("profiles")
          .select("subscription_expires_at")
          .eq("id", uid)
          .maybeSingle();
        if (teaserProfErr || !teaserProfile || !isCalendarTeaserEligible(teaserProfile)) {
          console.warn(
            "generate-reading teaser denied",
            endpoint,
            uid,
            teaserProfErr?.message ?? "not_calendar_teaser_eligible",
          );
          return ok(null, null, req);
        }
        if (endpoint === "day-detail" || endpoint === "ngay-hom-nay") {
          if (!dayIso || dayIso !== todayIsoVietnam()) {
            return ok(null, null, req);
          }
        }
        rateLimitUserId = uid;
      } else if (variant === "inline" && endpoint === "day-detail") {
        const { data: inlineProfile, error: inlineProfErr } = await adminGate
          .from("profiles")
          .select("subscription_expires_at")
          .eq("id", uid)
          .maybeSingle();
        if (inlineProfErr || !inlineProfile) {
          console.warn(
            "generate-reading inline day-detail denied",
            uid,
            inlineProfErr?.message ?? "profile_missing",
          );
          return ok(null, null, req);
        }
        if (inlineProfile.subscription_expires_at == null) {
          if (!dayIso || dayIso !== todayIsoVietnam()) {
            return ok(null, null, req);
          }
          rateLimitUserId = uid;
        } else {
          if (!dayIso) {
            return ok(null, null, req);
          }
          const preflight = await preflightAiReadingAccess(
            adminGate,
            uid,
            "day_detail",
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
      } else {
        if (!dayIso) {
          return ok(null, null, req);
        }
        const scope = endpoint === "ngay-hom-nay" ? "home" : "day_detail";
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
      const prewarmUserId =
        typeof body.prewarm_user_id === "string"
          ? body.prewarm_user_id.trim()
          : "";
      const auth = await requireBaziReadingAuth(req, {
        allowWithoutEntitlement: endpoint === "la-so-chi-tiet" && preview,
        prewarmUserId: prewarmUserId || undefined,
      });
      if (!auth) {
        console.warn("generate-reading bazi auth denied", endpoint);
        return ok(null, null, req);
      }
      rateLimitUserId = auth.uid;
      if (
        endpoint === "la-so-chi-tiet" &&
        !preview &&
        !prewarmUserId
      ) {
        trackProfileEngagement(auth.admin, auth.uid, "bazi_luan");
      }
    }

    if (endpoint === "van-trinh-nam") {
      const prewarmUserId =
        typeof body.prewarm_user_id === "string"
          ? body.prewarm_user_id.trim()
          : "";
      const auth = await requireTieuVanReadingAuth(req, {
        prewarmUserId: prewarmUserId || undefined,
      });
      if (!auth) {
        console.warn("generate-reading van-trinh-nam auth denied");
        return ok(null, null, req);
      }
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
            ...(variant === "inline" || variant === "teaser"
              ? { variant }
              : {}),
          }
        : {
            endpoint,
            data,
            ...(question ? { question } : {}),
            ...(variant === "inline" || variant === "teaser"
              ? { variant }
              : {}),
            ...(tinhCachTraitIds.length
              ? { tinh_cach_trait_ids: tinhCachTraitIds }
              : {}),
            ...(luuNienLifeAreaIds.length
              ? { luu_nien_life_area_ids: luuNienLifeAreaIds }
              : {}),
            ...(onlyVanTrinhA ? { only_van_trinh_a: true } : {}),
            ...(onlyVanTrinhC ? { only_van_trinh_c: true } : {}),
            ...(vanTrinhMonthNum >= 1 && vanTrinhMonthNum <= 12
              ? { month_num: vanTrinhMonthNum }
              : {}),
            ...(flowYear >= 2000 && flowYear <= 2100
              ? { flow_year: flowYear }
              : {}),
          };

    const dataJson = stableStringify(
      endpoint === "day-detail" && data !== null && typeof data === "object"
        ? (promptBody.luan_context as unknown)
        : data,
    );
    const endpointVer = endpointCacheVersion(endpoint, {
      preview,
      onlyTinhCach,
      onlyLuuNienLife,
      onlyLuuNienCore,
      question,
      variant,
    });
    const threadJson = threadHistory.length
      ? stableStringify(threadHistory)
      : "";
    const supplementKey = [
      tinhCachTraitIds.length ? `tinh:${tinhCachTraitIds.join(",")}` : "",
      luuNienLifeAreaIds.length ? `life:${luuNienLifeAreaIds.join(",")}` : "",
      onlyVanTrinhA ? "van-a" : "",
      onlyVanTrinhC ? "van-c" : "",
      vanTrinhMonthNum >= 1 && vanTrinhMonthNum <= 12
        ? `van-m${vanTrinhMonthNum}`
        : "",
      flowYear >= 2000 ? `fy${flowYear}` : "",
    ]
      .filter(Boolean)
      .join("|");
    const cacheInput = `${GLOBAL_LLM_VER}\n${endpointVer}\n${endpoint}\n${variant}\n${question}\n${preview ? "preview" : ""}\n${onlyTinhCach ? "only-tinh-cach" : ""}\n${onlyLuuNienLife ? "only-luu-life" : ""}\n${onlyLuuNienCore ? "only-luu-core" : ""}\n${supplementKey}\n${threadJson}\n${anchorReading ? await sha256Prefix16(anchorReading.slice(0, 4000)) : ""}\n${dataJson}`;
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
    let phongThuySeedSections: LaSoChiTietSection[] | undefined;

    if (admin) {
      const { getReadingCacheL2, setReadingCacheL2, readingCacheL2TtlSec } =
        await import("../../reading-cache-l2.ts");

      const hitArgs = {
        admin,
        req,
        endpoint,
        cacheKey,
        now,
        preview,
        onlyTinhCach,
        onlyLuuNienLife,
        onlyLuuNienCore,
        options,
      };

      const l2Raw = await getReadingCacheL2(cacheKey);
      if (l2Raw) {
        const l2Hit = await tryReadingCacheHit({
          ...hitArgs,
          reading: l2Raw,
          expiresAt: null,
        });
        if (l2Hit.kind === "response") return l2Hit.response;
        if (l2Hit.kind === "phong-seed") {
          phongThuySeedSections = l2Hit.sections;
        }
      }

      const { data: row, error: readErr } = await admin
        .from("reading_cache")
        .select("reading, expires_at")
        .eq("cache_key", cacheKey)
        .maybeSingle();

      if (!readErr && row && typeof row.reading === "string") {
        void setReadingCacheL2(
          cacheKey,
          row.reading,
          readingCacheL2TtlSec(row.expires_at as string),
        );
        const pgHit = await tryReadingCacheHit({
          ...hitArgs,
          reading: row.reading,
          expiresAt: row.expires_at as string,
        });
        if (pgHit.kind === "response") return pgHit.response;
        if (pgHit.kind === "phong-seed") {
          phongThuySeedSections = pgHit.sections;
        }
      }
    }

    if (rateLimitUserId) {
      const rlScope = generateReadingRateLimitScope(endpoint, {
        preview,
        onlyTinhCach,
        onlyLuuNienLife,
        onlyLuuNienCore,
        variant: variant || undefined,
        followUp: question.length > 0,
      });
      const slot = await acquireGenerateReadingRateLimit(rateLimitUserId, {
        followUp: question.length > 0,
        scope: rlScope,
      });
      if (!slot) {
        console.warn(
          "generate-reading rate limited",
          endpoint,
          rlScope,
          rateLimitUserId,
          question ? "follow-up" : "primary",
        );
        // HTTP 200 + reading null — FE retries after RATE_LIMIT_RETRY_MS (not 503).
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
      onlyTinhCach,
      onlyLuuNienLife,
      onlyLuuNienCore,
      promptBody,
      payload,
      cacheKey,
      admin,
      now,
      anchorReading,
      threadHistory,
      phongThuySeedSections,
    });

    return ok(
      result.reading,
      result.sections,
      req,
      result.dayReadings,
    );
  };
}
