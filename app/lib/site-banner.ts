import { supabase } from "~/lib/supabase";

/** `app_config.config_key` for sticky banner JSON. */
export const SITE_BANNER_CONFIG_KEY = "site_banner";

/** Poll interval while the app stays open (admin updates without full reload). */
export const SITE_BANNER_REFETCH_INTERVAL_MS = 5 * 60 * 1000;

export type SiteBannerPayload = {
  enabled: boolean;
  message: string;
  href: string | null;
};

const DEFAULT_BANNER: SiteBannerPayload = {
  enabled: false,
  message: "",
  href: null,
};

export function parseSiteBannerJson(raw: string | null | undefined): SiteBannerPayload {
  if (!raw?.trim()) return { ...DEFAULT_BANNER };
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const enabled = Boolean(o.enabled);
    const message = typeof o.message === "string" ? o.message : "";
    const href =
      o.href === null || o.href === undefined
        ? null
        : typeof o.href === "string"
          ? o.href.trim() || null
          : null;
    return { enabled, message, href };
  } catch {
    return { ...DEFAULT_BANNER };
  }
}

/** Client-side guard: never render javascript: or unexpected protocols. */
export function safeBannerHref(href: string | null): string | null {
  if (href === null || href === "") return null;
  if (href.startsWith("/") && !href.startsWith("//")) {
    if (/[\s<>"']/.test(href)) return null;
    return href;
  }
  try {
    const u = new URL(href);
    if (u.protocol === "https:") return href;
    if (
      u.protocol === "http:" &&
      (u.hostname === "localhost" || u.hostname === "127.0.0.1")
    ) {
      return href;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function siteBannerDismissStorageKey(signature: string): string {
  return `ngaytot_site_banner_dismiss_${simpleHash(signature)}`;
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return String(h);
}

export async function fetchSiteBannerFromDb(): Promise<SiteBannerPayload> {
  const { data, error } = await supabase
    .from("app_config")
    .select("value")
    .eq("config_key", SITE_BANNER_CONFIG_KEY)
    .maybeSingle();

  if (error) {
    console.warn("site_banner fetch", error.message);
    if (import.meta.env.DEV) {
      console.info(
        "[SiteBanner] Kiểm tra migration site_banner + app_config, hoặc Supabase URL/key trong .env.local.",
      );
    }
    return { ...DEFAULT_BANNER };
  }

  const parsed = parseSiteBannerJson(data?.value ?? null);

  if (
    import.meta.env.DEV &&
    (!data?.value || !parsed.enabled || !parsed.message.trim())
  ) {
    console.info(
      "[SiteBanner] Đang ẩn: cần app_config.site_banner với enabled=true và message không rỗng. " +
        "Local: supabase db reset (seed) hoặc SQL / admin-site-banner PUT.",
    );
  }

  return parsed;
}
