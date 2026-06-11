import type { LaSoJson } from "~/lib/api-types";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { mergeLaSoJsonForChiTietDisplay } from "~/lib/la-so-ui-chi-tiet-core";
import { profileHasStoredLaso } from "~/lib/la-so-ui-reveal";
import type { Profile } from "~/lib/profile-context";
import {
  laSoMatchesBatTuBody,
  storedLaSoForMerge,
} from "../../shared/la-so-birth-identity.ts";

type BirthProfileSlice = Pick<
  Profile,
  "ngay_sinh" | "gio_sinh" | "gioi_tinh" | "la_so"
>;

/** `profiles.la_so` có JSON nhưng birth identity không khớp ngày/giờ trên hồ sơ. */
export function profileLaSoNeedsRecompute(
  profile: BirthProfileSlice | null | undefined,
): boolean {
  if (!profile || !profileHasStoredLaso(profile.la_so)) return false;
  const body = profileToBatTuPersonQuery(profile);
  if (!body.birth_date) return false;
  return !laSoMatchesBatTuBody(profile.la_so, body);
}

export type MergeLaSoForProfileOptions = {
  /** Chỉ khi API lỗi — cho phép fallback `profile.la_so` dù identity lệch. */
  allowStaleFallback?: boolean;
};

/**
 * Ghép `profile.la_so` + enrichment API — không merge từ cache stale khi birth lệch.
 */
export function mergeLaSoForProfileDisplay(
  profile: BirthProfileSlice | null | undefined,
  enrichment: Record<string, unknown> | null | undefined,
  options?: MergeLaSoForProfileOptions,
): LaSoJson | null {
  if (!profile) return null;
  const body = profileToBatTuPersonQuery(profile);
  const storedBase = storedLaSoForMerge(profile.la_so, body) as LaSoJson | null;
  const merged = mergeLaSoJsonForChiTietDisplay(storedBase, enrichment);
  if (merged) return merged as LaSoJson;
  if (storedBase) return storedBase;
  if (options?.allowStaleFallback && profileHasStoredLaso(profile.la_so)) {
    return profile.la_so as LaSoJson;
  }
  return null;
}
