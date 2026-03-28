import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { queryKeys } from "~/lib/query-keys";
import {
  fetchSiteBannerFromDb,
  safeBannerHref,
  SITE_BANNER_REFETCH_INTERVAL_MS,
  siteBannerDismissStorageKey,
  type SiteBannerPayload,
} from "~/lib/site-banner";

function bannerSignature(b: SiteBannerPayload): string {
  return `${b.enabled}:${b.message}:${b.href ?? ""}`;
}

export function SiteBanner() {
  const { data: banner } = useQuery({
    queryKey: queryKeys.siteBanner(),
    queryFn: fetchSiteBannerFromDb,
    refetchInterval: SITE_BANNER_REFETCH_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });

  const [dismissed, setDismissed] = useState(false);

  const signature = useMemo(
    () => (banner ? bannerSignature(banner) : ""),
    [banner],
  );

  useEffect(() => {
    if (!signature || typeof window === "undefined") return;
    const key = siteBannerDismissStorageKey(signature);
    setDismissed(localStorage.getItem(key) === "1");
  }, [signature]);

  if (!banner?.enabled || !banner.message.trim() || dismissed) {
    return null;
  }

  const href = safeBannerHref(banner.href);

  const dismiss = () => {
    if (typeof window === "undefined") return;
    localStorage.setItem(siteBannerDismissStorageKey(signature), "1");
    setDismissed(true);
  };

  const inner = (
    <span className="min-w-0 flex-1 text-center text-[13px] leading-snug text-forest-foreground sm:text-sm">
      {banner.message}
    </span>
  );

  const linkClass =
    "flex min-w-0 flex-1 flex-col items-center text-forest-foreground underline decoration-forest-foreground/45 underline-offset-2 transition hover:decoration-primary sm:inline sm:flex-initial";

  return (
    <div
      role="region"
      aria-label="Thông báo"
      className="sticky top-0 z-[200] border-b border-forest-foreground/15 bg-forest text-forest-foreground shadow-sm"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-2.5 pr-2 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2 sm:gap-3">
          {href ? (
            href.startsWith("/") ? (
              <Link to={href} className={linkClass}>
                {inner}
              </Link>
            ) : (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {inner}
              </a>
            )
          ) : (
            <div className="flex min-w-0 flex-1 justify-center">{inner}</div>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-md p-1.5 text-forest-foreground/80 transition hover:bg-forest-foreground/10 hover:text-forest-foreground"
          aria-label="Đóng thông báo"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
