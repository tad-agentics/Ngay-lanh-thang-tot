import type { PostgrestError } from "@supabase/supabase-js";

import type { Database } from "~/lib/database.types";
import type { LandingSignupPrefill } from "~/lib/landing-cta-constants";
import { supabase } from "~/lib/supabase";

export type ApplyLandingPrefillOptions = {
  /** Form already saved birth fields — do not overwrite from URL prefill. */
  skipBirthFields?: boolean;
  /** Form already saved display name — do not overwrite from URL prefill. */
  skipDisplayName?: boolean;
};

/** Maps landing CTA / signup query prefill to `profiles` columns (client + RLS). */
export async function applyLandingPrefillToProfile(
  userId: string,
  prefill: LandingSignupPrefill,
  opts?: ApplyLandingPrefillOptions,
): Promise<PostgrestError | null> {
  const patch: Database["public"]["Tables"]["profiles"]["Update"] = {};
  if (prefill.displayName && !opts?.skipDisplayName) {
    patch.display_name = prefill.displayName;
  }
  if (!opts?.skipBirthFields) {
    if (prefill.ngaySinh) patch.ngay_sinh = prefill.ngaySinh;
    if (prefill.gioSinh) patch.gio_sinh = prefill.gioSinh;
    if (prefill.gioiTinh) patch.gioi_tinh = prefill.gioiTinh;
  }
  if (Object.keys(patch).length === 0) return null;
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  return error;
}
