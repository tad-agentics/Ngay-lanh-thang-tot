import {
  baziReadingDeliveryIsComplete,
  loadBaziPaywallBundleCached,
  loadBaziReadingFull,
} from "~/lib/bazi-reading-load";
import { fetchBaziReadingDelivery } from "~/lib/bazi-reading-delivery";
import {
  baziReadingCacheRevision,
  currentYearVn,
  readBaziPaywallTeaserCache,
} from "~/lib/bazi-reading-session";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { canUseBaziReading } from "~/lib/entitlements";
import {
  isBaziReadingScreenLoadActive,
  setBaziReadingScreenLoadActive,
} from "~/lib/bazi-reading-load-coord";
import type { Profile } from "~/lib/profile-context";

const PREWARM_STORAGE_PREFIX = "bazi-prewarm:";

/** Dedupe trong phiên trang, kể cả khi localStorage bị chặn (private mode). */
const paywallTeaserPrewarmInflight = new Set<string>();

export {
  isBaziReadingScreenLoadActive,
  setBaziReadingScreenLoadActive,
};

function prewarmStorageKey(profile: Profile, year: number): string {
  return `${PREWARM_STORAGE_PREFIX}${profile.id}:${baziReadingCacheRevision(profile, year)}`;
}

function readPrewarmStatus(key: string): "idle" | "running" | "done" {
  try {
    const v = sessionStorage.getItem(key);
    if (v === "running" || v === "done") return v;
  } catch {
    /* private mode */
  }
  return "idle";
}

function writePrewarmStatus(key: string, status: "running" | "done" | "idle"): void {
  try {
    if (status === "idle") sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, status);
  } catch {
    /* ignore */
  }
}

/** Hủy prewarm đang chạy (vào màn luận / reload). */
export function cancelBaziReadingPrewarm(
  profile: Profile,
  year?: number,
): void {
  const y = year ?? currentYearVn();
  writePrewarmStatus(prewarmStorageKey(profile, y), "idle");
}

export type ScheduleBaziPrewarmOptions = {
  year?: number;
  /** Bỏ qua khi màn `/toi/luan-bat-tu` đang chạy loader hiển thị. */
  skipWhenScreenLoading?: boolean;
};

/**
 * Sinh luận nền sau unlock — cache DB + reading_cache để mở màn gần như tức thì.
 * Idempotent theo profile + năm (sessionStorage).
 */
export function scheduleBaziReadingPrewarm(
  profile: Profile,
  options?: ScheduleBaziPrewarmOptions,
): void {
  if (options?.skipWhenScreenLoading || isBaziReadingScreenLoadActive()) return;
  if (!canUseBaziReading(profile)) return;
  if (!profileToBatTuPersonQuery(profile).birth_date) return;

  const year = options?.year ?? currentYearVn();
  const key = prewarmStorageKey(profile, year);
  if (readPrewarmStatus(key) !== "idle") return;

  writePrewarmStatus(key, "running");

  void (async () => {
    if (isBaziReadingScreenLoadActive()) {
      writePrewarmStatus(key, "idle");
      return;
    }

    const stored = await fetchBaziReadingDelivery(profile, year);
    if (
      stored &&
      baziReadingDeliveryIsComplete(stored.sections, {
        luuNienFactsRaw: stored.luuNienFactsRaw,
        phongThuyFactsRaw: stored.phongThuyFactsRaw,
      })
    ) {
      writePrewarmStatus(key, "done");
      return;
    }

    if (isBaziReadingScreenLoadActive()) {
      writePrewarmStatus(key, "idle");
      return;
    }

    await loadBaziReadingFull(profile, year, { loadSource: "prewarm" });
    if (!isBaziReadingScreenLoadActive()) {
      writePrewarmStatus(key, "done");
    } else {
      writePrewarmStatus(key, "idle");
    }
  })().catch(() => {
    writePrewarmStatus(key, "idle");
  });
}

/**
 * Làm ấm teaser Bát Tự (§01) cho **non-buyer** — chạy nền sau khi có profile.
 * Sinh `la-so-chi-tiet` preview → `reading_cache` (server) + session/local cache
 * sẵn trước khi user mở `/toi`. Buyer dùng full prewarm.
 */
export function scheduleBaziPaywallTeaserPrewarm(profile: Profile): void {
  if (isBaziReadingScreenLoadActive()) return;
  if (canUseBaziReading(profile)) return; // buyer → full prewarm lo phần này
  if (!profileToBatTuPersonQuery(profile).birth_date) return;

  const revision = baziReadingCacheRevision(profile);
  if (readBaziPaywallTeaserCache(profile.id, revision)?.menhOverview) return;

  const inflightKey = `${profile.id}:${revision}`;
  if (paywallTeaserPrewarmInflight.has(inflightKey)) return;

  paywallTeaserPrewarmInflight.add(inflightKey);
  void loadBaziPaywallBundleCached(profile)
    .catch(() => {
      // best-effort; thất bại để luồng paywall live (đã có retry) tự xử lý
    })
    .finally(() => {
      paywallTeaserPrewarmInflight.delete(inflightKey);
    });
}
