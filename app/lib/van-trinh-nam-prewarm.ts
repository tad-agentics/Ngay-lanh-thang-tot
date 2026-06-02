import {
  cachedSessionIsComplete,
  fetchVanTrinhNamContext,
  loadVanTrinhNamFull,
} from "~/lib/van-trinh-nam-load";
import {
  fetchVanTrinhNamDelivery,
  persistVanTrinhNamDelivery,
} from "~/lib/van-trinh-nam-delivery";
import { vanTrinhNamDeliveryIsComplete } from "~/lib/van-trinh-nam-delivery-complete";
import { VAN_TRINH_NAM_DELIVERY_CONTENT_VERSION } from "~/lib/van-trinh-nam-content-version";
import {
  currentYearVn,
  vanTrinhNamBirthRevision,
} from "~/lib/van-trinh-nam-session";
import { canUseTieuVanReading } from "~/lib/entitlements";
import { profileHasLaso } from "~/lib/la-so-ui";
import { isVanTrinhNamScreenLoadActive } from "~/lib/van-trinh-nam-load-coord";
import type { Profile } from "~/lib/profile-context";

const PREWARM_STORAGE_PREFIX = "van-trinh-prewarm:";

function prewarmStorageKey(profile: Profile, year: number): string {
  return `${PREWARM_STORAGE_PREFIX}${profile.id}:${year}:${VAN_TRINH_NAM_DELIVERY_CONTENT_VERSION}:${vanTrinhNamBirthRevision(profile)}`;
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

export function cancelVanTrinhNamPrewarm(profile: Profile, year?: number): void {
  const y = year ?? currentYearVn();
  writePrewarmStatus(prewarmStorageKey(profile, y), "idle");
}

export type ScheduleVanTrinhNamPrewarmOptions = {
  year?: number;
  skipWhenScreenLoading?: boolean;
};

/** Sinh luận nền sau unlock — DB delivery + session để mở màn gần tức thì. */
export function scheduleVanTrinhNamPrewarm(
  profile: Profile,
  options?: ScheduleVanTrinhNamPrewarmOptions,
): void {
  if (options?.skipWhenScreenLoading || isVanTrinhNamScreenLoadActive()) return;
  if (!canUseTieuVanReading(profile) || !profileHasLaso(profile.la_so)) return;

  const year = options?.year ?? currentYearVn();
  const key = prewarmStorageKey(profile, year);
  if (readPrewarmStatus(key) !== "idle") return;

  writePrewarmStatus(key, "running");

  void (async () => {
    if (isVanTrinhNamScreenLoadActive()) {
      writePrewarmStatus(key, "idle");
      return;
    }

    const ctx = await fetchVanTrinhNamContext(profile, year);
    if (!ctx) {
      writePrewarmStatus(key, "idle");
      return;
    }

    const stored = await fetchVanTrinhNamDelivery(profile, year, {
      liveEngineVersion: ctx.meta.engine_version,
    });
    if (
      stored &&
      vanTrinhNamDeliveryIsComplete(stored.sections, stored.luanContext)
    ) {
      writePrewarmStatus(key, "done");
      return;
    }

    if (isVanTrinhNamScreenLoadActive()) {
      writePrewarmStatus(key, "idle");
      return;
    }

    const full = await loadVanTrinhNamFull(profile, year, ctx);
    if (cachedSessionIsComplete(full)) {
      void persistVanTrinhNamDelivery(profile, year, full);
    }

    if (!isVanTrinhNamScreenLoadActive()) {
      writePrewarmStatus(key, "done");
    } else {
      writePrewarmStatus(key, "idle");
    }
  })().catch(() => {
    writePrewarmStatus(key, "idle");
  });
}
