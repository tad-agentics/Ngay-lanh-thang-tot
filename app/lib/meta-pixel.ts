import type { PackageSku } from "~/lib/api-types";
import { readMarketingConsent } from "~/lib/meta-pixel-consent";

const envPixelId = import.meta.env.VITE_META_PIXEL_ID;
export const META_PIXEL_ID =
  typeof envPixelId === "string" && envPixelId.trim()
    ? envPixelId.trim()
    : "1582170927254758";

const META_PIXEL_SCRIPT_ID = "meta-pixel-sdk";
const PURCHASE_DEDUPE_PREFIX = "ngaytot:meta_pixel_purchase:";

/** List prices (VND) when `payment_orders.amount_vnd` is unavailable client-side. */
export const PACKAGE_AMOUNT_VND: Record<PackageSku, number> = {
  le: 16_000,
  goi_1thang: 299_000,
  goi_6thang: 499_000,
  goi_12thang: 799_000,
  luan_bat_tu: 299_000,
  luan_tieu_van: 199_000,
};

const META_PIXEL_LOADER = `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');`;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export function isMetaPixelRuntimeEnabled(): boolean {
  return import.meta.env.PROD;
}

export function isMetaPixelAllowed(): boolean {
  return (
    isMetaPixelRuntimeEnabled() && readMarketingConsent() === "granted"
  );
}

let pixelLoadPromise: Promise<void> | null = null;
let pixelInitialized = false;

function waitForFbq(timeoutMs = 8000): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      if (typeof window.fbq === "function") {
        resolve();
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

/** Inject fbevents.js + `fbq('init')` once, after marketing consent. */
export function ensureMetaPixelLoaded(): Promise<void> {
  if (!isMetaPixelAllowed()) return Promise.resolve();
  if (typeof window.fbq === "function") {
    if (!pixelInitialized) {
      window.fbq("init", META_PIXEL_ID);
      pixelInitialized = true;
    }
    return Promise.resolve();
  }
  if (pixelLoadPromise) return pixelLoadPromise;

  pixelLoadPromise = (async () => {
    if (!document.getElementById(META_PIXEL_SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = META_PIXEL_SCRIPT_ID;
      script.async = true;
      script.innerHTML = META_PIXEL_LOADER;
      document.head.appendChild(script);
      await waitForFbq();
    }
    if (typeof window.fbq === "function" && !pixelInitialized) {
      window.fbq("init", META_PIXEL_ID);
      pixelInitialized = true;
    }
  })();

  return pixelLoadPromise;
}

export function trackMetaPageView(): void {
  if (!isMetaPixelAllowed()) return;
  void ensureMetaPixelLoaded().then(() => {
    if (typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  });
}

export type MetaPurchaseTrackArgs = {
  orderId: string;
  valueVnd: number;
  contentName?: string;
  contentIds?: string[];
};

export function resolvePurchaseValueVnd(
  amountVnd: number | null | undefined,
  packageSku: PackageSku,
): number | null {
  if (typeof amountVnd === "number" && Number.isFinite(amountVnd) && amountVnd > 0) {
    return Math.round(amountVnd);
  }
  const fallback = PACKAGE_AMOUNT_VND[packageSku];
  return fallback > 0 ? fallback : null;
}

/** Deduped per order id in sessionStorage (webhook + poll may both mark paid). */
export function trackMetaPurchaseOnce(args: MetaPurchaseTrackArgs): void {
  if (!isMetaPixelAllowed() || !args.orderId) return;
  const value = Math.round(args.valueVnd);
  if (!Number.isFinite(value) || value <= 0) return;

  try {
    const dedupeKey = PURCHASE_DEDUPE_PREFIX + args.orderId;
    if (sessionStorage.getItem(dedupeKey) === "1") return;
    sessionStorage.setItem(dedupeKey, "1");
  } catch {
    /* private mode */
  }

  void ensureMetaPixelLoaded().then(() => {
    if (typeof window.fbq !== "function") return;
    window.fbq("track", "Purchase", {
      value,
      currency: "VND",
      content_name: args.contentName,
      content_ids: args.contentIds,
      content_type: "product",
    });
  });
}

export function metaPixelNoscriptImageUrl(): string {
  return `https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`;
}
