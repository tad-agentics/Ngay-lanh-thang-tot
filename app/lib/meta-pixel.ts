import type { PackageSku } from "~/lib/api-types";
import { resolveOrderChargeAmounts } from "~/lib/payment-order-charge";
import { PACKAGE_AMOUNT_VND } from "~/lib/package-amount-vnd";

export { PACKAGE_AMOUNT_VND };

const envPixelId = import.meta.env.VITE_META_PIXEL_ID;
export const META_PIXEL_ID =
  typeof envPixelId === "string" && envPixelId.trim()
    ? envPixelId.trim()
    : "1582170927254758";

const PURCHASE_DEDUPE_PREFIX = "ngaytot:meta_pixel_purchase:";
const INITIATE_CHECKOUT_DEDUPE_PREFIX = "ngaytot:meta_pixel_initiate_checkout:";

/** Meta base snippet loader (fbevents.js). */
const META_PIXEL_LOADER = `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');`;

/** Inline script body for `<head>` — matches Meta Events Manager install diagram. */
export const META_PIXEL_HEAD_SCRIPT = `${META_PIXEL_LOADER}
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`;

export const META_PIXEL_NOSCRIPT_IMG_URL = `https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export function isMetaPixelRuntimeEnabled(): boolean {
  return import.meta.env.PROD;
}

/** Alias for purchase / SPA helpers (pixel loads from head when enabled). */
export function isMetaPixelAllowed(): boolean {
  return isMetaPixelRuntimeEnabled();
}

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

/** Resolves when `fbq` is available (injected in document head on production). */
export function ensureMetaPixelLoaded(): Promise<void> {
  if (!isMetaPixelRuntimeEnabled()) return Promise.resolve();
  if (typeof window.fbq === "function") return Promise.resolve();
  return waitForFbq();
}

export function trackMetaPageView(): void {
  if (!isMetaPixelRuntimeEnabled()) return;
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

export type MetaInitiateCheckoutTrackArgs = {
  packageSku: PackageSku;
  valueVnd: number;
  contentName?: string;
};

/**
 * Digits only for Meta Event Setup DOM picker.
 * Do not use dotted amounts without Intl currency — Meta may parse `.` as decimal.
 * Visible prices use `formatVndPriceDisplay` (`299.000 ₫`); picker id stays digits-only.
 */
export function formatMetaEventSetupValue(amountVnd: number): string {
  return String(Math.round(amountVnd));
}

export type ResolvePurchaseValueOpts = {
  listAmountVnd?: number | null;
  discountBreakdown?: unknown;
  pendingAmountVnd?: number | null;
  pendingListAmountVnd?: number | null;
};

export function resolvePurchaseValueVnd(
  amountVnd: number | null | undefined,
  packageSku: PackageSku,
  opts?: ResolvePurchaseValueOpts,
): number | null {
  return (
    resolveOrderChargeAmounts({
      packageSku,
      amountVnd,
      listAmountVnd: opts?.listAmountVnd,
      discountBreakdown: opts?.discountBreakdown,
      pendingAmountVnd: opts?.pendingAmountVnd,
      pendingListAmountVnd: opts?.pendingListAmountVnd,
    })?.finalVnd ?? null
  );
}

/** Deduped per checkout session in sessionStorage. */
export function trackMetaInitiateCheckoutOnce(
  args: MetaInitiateCheckoutTrackArgs,
): void {
  if (!isMetaPixelRuntimeEnabled()) return;
  const value = Math.round(args.valueVnd);
  if (!Number.isFinite(value) || value <= 0) return;

  const dedupeKey =
    INITIATE_CHECKOUT_DEDUPE_PREFIX + args.packageSku + ":" + String(value);
  try {
    if (sessionStorage.getItem(dedupeKey) === "1") return;
    sessionStorage.setItem(dedupeKey, "1");
  } catch {
    /* private mode */
  }

  void ensureMetaPixelLoaded().then(() => {
    if (typeof window.fbq !== "function") return;
    window.fbq("track", "InitiateCheckout", {
      value,
      currency: "VND",
      content_name: args.contentName,
      content_ids: [args.packageSku],
      content_type: "product",
      num_items: 1,
    });
  });
}

/** Deduped per order id in sessionStorage (webhook + poll may both mark paid). */
export function trackMetaPurchaseOnce(args: MetaPurchaseTrackArgs): void {
  if (!isMetaPixelRuntimeEnabled() || !args.orderId) return;
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
