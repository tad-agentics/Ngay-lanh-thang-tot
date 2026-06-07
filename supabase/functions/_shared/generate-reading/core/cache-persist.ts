import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import { syncReadingCacheL2 } from "../../reading-cache-l2.ts";
import { readCachedBody } from "../core/cache.ts";
import { ok } from "../core/response.ts";
import type { LaSoChiTietSection } from "../core/types.ts";

type CacheValidateOptions = {
  transformCachedLaSoSections?: (
    sections: LaSoChiTietSection[],
    preview: boolean,
  ) => LaSoChiTietSection[];
  cachedSectionsValid?: (sections: LaSoChiTietSection[]) => boolean;
  tieuVanCachedSectionsValid?: (sections: LaSoChiTietSection[]) => boolean;
  laSoChiTietCachedSectionsValid?: (sections: LaSoChiTietSection[]) => boolean;
  tinhCachCachedSectionsValid?: (sections: LaSoChiTietSection[]) => boolean;
  luuNienLifeCachedSectionsValid?: (sections: LaSoChiTietSection[]) => boolean;
  luuNienCoreCachedSectionsValid?: (sections: LaSoChiTietSection[]) => boolean;
  phongThuyCachedSectionsValid?: (sections: LaSoChiTietSection[]) => boolean;
  phongThuyAllBlocksCachedValid?: (sections: LaSoChiTietSection[]) => boolean;
};

export async function persistReadingCache(
  admin: SupabaseClient,
  cacheKey: string,
  reading: string,
  expiresAt: string,
): Promise<void> {
  await admin.from("reading_cache").upsert(
    { cache_key: cacheKey, reading, expires_at: expiresAt },
    { onConflict: "cache_key" },
  );
  void syncReadingCacheL2(cacheKey, reading, expiresAt);
}

export type ReadingCacheHit =
  | { kind: "response"; response: Response }
  | { kind: "phong-seed"; sections: LaSoChiTietSection[] }
  | { kind: "miss" };

type HitArgs = {
  admin: SupabaseClient;
  req: Request;
  endpoint: string;
  cacheKey: string;
  reading: string;
  expiresAt: string | null;
  now: number;
  preview: boolean;
  onlyTinhCach: boolean;
  onlyLuuNienLife: boolean;
  onlyLuuNienCore: boolean;
  options: CacheValidateOptions;
};

/** Shared Postgres + Redis L2 cache validation. */
export async function tryReadingCacheHit(
  args: HitArgs,
): Promise<ReadingCacheHit> {
  const {
    admin,
    req,
    endpoint,
    cacheKey,
    reading,
    expiresAt,
    now,
    preview,
    onlyTinhCach,
    onlyLuuNienLife,
    onlyLuuNienCore,
    options,
  } = args;

  if (expiresAt && new Date(expiresAt).getTime() <= now) {
    return { kind: "miss" };
  }

  const cached = readCachedBody(endpoint, reading);

  if (endpoint === "la-so-chi-tiet") {
    if (cached.sections != null && cached.sections.length > 0) {
      if (onlyTinhCach) {
        const tinhValid = options.tinhCachCachedSectionsValid;
        if (tinhValid && !tinhValid(cached.sections)) {
          await admin.from("reading_cache").delete().eq("cache_key", cacheKey);
          return { kind: "miss" };
        }
        const out = options.transformCachedLaSoSections
          ? options.transformCachedLaSoSections(cached.sections, preview)
          : cached.sections;
        return { kind: "response", response: ok(null, out, req) };
      }
      const laSoValid = options.laSoChiTietCachedSectionsValid;
      if (laSoValid && !laSoValid(cached.sections)) {
        await admin.from("reading_cache").delete().eq("cache_key", cacheKey);
        return { kind: "miss" };
      }
      const out = options.transformCachedLaSoSections
        ? options.transformCachedLaSoSections(cached.sections, preview)
        : cached.sections;
      return { kind: "response", response: ok(null, out, req) };
    }
    await admin.from("reading_cache").delete().eq("cache_key", cacheKey);
    return { kind: "miss" };
  }

  if (
    endpoint === "tieu-van" ||
    endpoint === "luu-nien" ||
    endpoint === "van-trinh-nam" ||
    endpoint === "phong-thuy"
  ) {
    if (cached.sections != null && cached.sections.length > 0) {
      if (endpoint === "phong-thuy") {
        const allOk =
          options.phongThuyAllBlocksCachedValid?.(cached.sections) ?? false;
        const partialOk =
          options.phongThuyCachedSectionsValid?.(cached.sections) ?? false;
        if (allOk) {
          return { kind: "response", response: ok(null, cached.sections, req) };
        }
        if (partialOk) {
          return { kind: "phong-seed", sections: cached.sections };
        }
        await admin.from("reading_cache").delete().eq("cache_key", cacheKey);
        return { kind: "miss" };
      }
      let validate =
        options.cachedSectionsValid ?? options.tieuVanCachedSectionsValid;
      if (endpoint === "luu-nien" && onlyLuuNienLife) {
        validate = options.luuNienLifeCachedSectionsValid ?? validate;
      } else if (endpoint === "luu-nien" && onlyLuuNienCore) {
        validate = options.luuNienCoreCachedSectionsValid ?? validate;
      }
      const valid = validate?.(cached.sections) ?? true;
      if (valid) {
        return { kind: "response", response: ok(null, cached.sections, req) };
      }
      await admin.from("reading_cache").delete().eq("cache_key", cacheKey);
      return { kind: "miss" };
    }
    const r = cached.reading?.trim() ?? "";
    if (r.length > 0) {
      return { kind: "response", response: ok(r, null, req) };
    }
    await admin.from("reading_cache").delete().eq("cache_key", cacheKey);
    return { kind: "miss" };
  }

  if (endpoint === "chon-ngay-cards") {
    if (
      cached.dayReadings != null &&
      Object.keys(cached.dayReadings).length > 0
    ) {
      return {
        kind: "response",
        response: ok(null, null, req, cached.dayReadings),
      };
    }
    await admin.from("reading_cache").delete().eq("cache_key", cacheKey);
    return { kind: "miss" };
  }

  const r = cached.reading?.trim() ?? "";
  if (r.length > 0) {
    return { kind: "response", response: ok(r, null, req) };
  }
  await admin.from("reading_cache").delete().eq("cache_key", cacheKey);
  return { kind: "miss" };
}
