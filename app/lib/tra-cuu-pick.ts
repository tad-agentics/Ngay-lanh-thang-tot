import type { Profile } from "~/lib/profile-context";
import type { TuTruIntent } from "~/lib/api-types";
import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { mapChonNgayPayloadToResultDays } from "~/lib/chon-ngay-result";
import type { ChonNgayKetQuaState } from "~/lib/chon-ngay-flow";
import { isoDateToDdMmYyyy } from "~/lib/tu-tru-dates";
import { TU_TRU_INTENT_OPTIONS } from "~/lib/tu-tru-intents";

/** Edge `bat-tu` REQ-NLTT-01 — Tab Tra cứu (`chon-ngay`, `hop-tuoi`): sub gate, no credit. Not sent upstream. */
export const BAT_TU_SOURCE_TRA_CUU = "tra_cuu";

export const TRA_CUU_PICK_MIN_OVERLAY_MS = 800;
export const TRA_CUU_PICK_SLOW_MS = 8000;

/** Upstream `chon-ngay` — tu-tru-api max 10; extra headroom vs UI list (5). */
export const TRA_CUU_CHON_NGAY_TOP_N = 10;
/** Max rows shown in results list. */
export const TRA_CUU_DISPLAY_MAX_DAYS = 5;

export type TraCuuPickPending = {
  intent: TuTruIntent;
  intentLabel: string;
  rangeStart: string;
  rangeEnd: string;
  daysInclusive: number;
};

export type TraCuuPickResult =
  | { ok: true; ketQua: ChonNgayKetQuaState }
  | { ok: false; code: "NO_DAYS"; ketQua: Omit<ChonNgayKetQuaState, "payload"> }
  | {
      ok: false;
      code: "API" | "SUB_EXPIRED" | "INVALID_RANGE" | "NO_PROFILE";
      message: string;
    };

export function delayMs(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function runTraCuuChonNgay(
  profile: Profile | null | undefined,
  pending: TraCuuPickPending,
): Promise<TraCuuPickResult> {
  if (!profile?.ngay_sinh) {
    return { ok: false, code: "NO_PROFILE", message: "Cần ngày sinh trong hồ sơ." };
  }

  const rs = isoDateToDdMmYyyy(pending.rangeStart);
  const re = isoDateToDdMmYyyy(pending.rangeEnd);
  if (!rs || !re) {
    return { ok: false, code: "INVALID_RANGE", message: "Khoảng ngày không hợp lệ." };
  }

  const base = profileToBatTuPersonQuery(profile);
  const res = await invokeBatTu({
    op: "chon-ngay",
    body: {
      ...base,
      intent: pending.intent,
      range_start: rs,
      range_end: re,
      top_n: TRA_CUU_CHON_NGAY_TOP_N,
      source: BAT_TU_SOURCE_TRA_CUU,
    },
  });

  if (!res.ok) {
    if (res.code === "SUB_EXPIRED") {
      return { ok: false, code: "SUB_EXPIRED", message: res.message };
    }
    return { ok: false, code: "API", message: res.message };
  }

  const label =
    pending.intentLabel ??
    TU_TRU_INTENT_OPTIONS.find((o) => o.value === pending.intent)?.label ??
    pending.intent;

  const meta = {
    intent: pending.intent,
    intentLabel: label,
    rangeStart: pending.rangeStart,
    rangeEnd: pending.rangeEnd,
    daysInclusive: pending.daysInclusive,
  };

  const days = mapChonNgayPayloadToResultDays(res.data, TRA_CUU_CHON_NGAY_TOP_N);
  if (days.length === 0) {
    return { ok: false, code: "NO_DAYS", ketQua: meta };
  }

  return {
    ok: true,
    ketQua: { ...meta, payload: res.data },
  };
}
