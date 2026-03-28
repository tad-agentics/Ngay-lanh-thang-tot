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
    <span className="min-w-0 flex-1 text-center text-[13px] leading-snug sm:text-sm">
      {banner.message}
    </span>
  );

  return (
    <div
      role="region"
      aria-label="Thông báo"
      className="sticky top-0 z-[200] border-b border-amber-900/25 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-amber-50 shadow-sm"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-2.5 pr-2 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2 sm:gap-3">
          {href ? (
            href.startsWith("/") ? (
              <Link
                to={href}
                className="flex min-w-0 flex-1 flex-col items-center text-amber-50 underline decoration-amber-400/60 underline-offset-2 transition hover:decoration-amber-200 sm:inline sm:flex-initial"
              >
                {inner}
              </Link>
            ) : (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 flex-1 flex-col items-center text-amber-50 underline decoration-amber-400/60 underline-offset-2 transition hover:decoration-amber-200 sm:inline sm:flex-initial"
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
          className="shrink-0 rounded-md p-1.5 text-amber-200/90 transition hover:bg-amber-950/50 hover:text-amber-50"
          aria-label="Đóng thông báo"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
