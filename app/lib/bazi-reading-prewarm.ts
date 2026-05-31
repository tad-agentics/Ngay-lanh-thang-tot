import {
  baziReadingDeliveryIsComplete,
  loadBaziReadingFull,
} from "~/lib/bazi-reading-load";
import { fetchBaziReadingDelivery } from "~/lib/bazi-reading-delivery";
import {
  baziReadingCacheRevision,
  currentYearVn,
} from "~/lib/bazi-reading-session";
import { canUseBaziReading } from "~/lib/entitlements";
import { profileHasLaso } from "~/lib/la-so-ui";
import type { Profile } from "~/lib/profile-context";

const PREWARM_STORAGE_PREFIX = "bazi-prewarm:";

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
  if (options?.skipWhenScreenLoading) return;
  if (!canUseBaziReading(profile) || !profileHasLaso(profile.la_so)) return;

  const year = options?.year ?? currentYearVn();
  const key = prewarmStorageKey(profile, year);
  if (readPrewarmStatus(key) !== "idle") return;

  writePrewarmStatus(key, "running");

  void (async () => {
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

    await loadBaziReadingFull(profile, year);
    writePrewarmStatus(key, "done");
  })().catch(() => {
    writePrewarmStatus(key, "idle");
  });
}
