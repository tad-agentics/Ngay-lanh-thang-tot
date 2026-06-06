/** Direction C entitlement helpers — shared by bat-tu, generate-reading, payos-webhook. */

export {
  type ProfileEntitlements,
  applyYearlyBundleLuận,
  canUseBaziReading,
  canUseCalendar,
  canUseTieuVanReading,
  extendSubscriptionMonths,
  isCalendarTeaserEligible,
  isNeverSubscribedUser,
  isSubscriptionLapsed,
  subscriptionActive,
} from "../../../shared/entitlements-core.ts";

/** NLTT-only body flag on Tab Tra cứu `bat-tu` ops — REQ-NLTT-01; never forwarded upstream. */
export const BAT_TU_SOURCE_TRA_CUU = "tra_cuu";

export function isTraCuuPickChonNgay(
  op: string,
  body: Record<string, unknown>,
): boolean {
  if (String(body.source ?? "").toLowerCase() !== BAT_TU_SOURCE_TRA_CUU) {
    return false;
  }
  return op === "chon-ngay" || op === "hop-tuoi";
}
