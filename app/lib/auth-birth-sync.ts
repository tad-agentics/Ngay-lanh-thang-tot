import type { User } from "@supabase/supabase-js";

import { displayNameFromAuthUser } from "~/lib/auth-onboarding";
import {
  profileHasBirthChartInput,
  type PostLoginProfile,
} from "~/lib/pending-return-to";
import { validateProfileNgaySinhIso } from "~/lib/ngay-sinh-range";
import { supabase } from "~/lib/supabase";

export type SignupBirthFields = {
  ngay_sinh: string;
  gio_sinh: string;
  gioi_tinh: "nam" | "nu";
};

/** Birth data stashed on `signUp({ options: { data } })` until profile row is written. */
export function parseSignupBirthFromMetadata(
  meta: Record<string, unknown> | undefined,
): SignupBirthFields | null {
  if (!meta) return null;
  const ngay_sinh =
    typeof meta.ngay_sinh === "string" ? meta.ngay_sinh.trim() : "";
  const gio_sinh =
    typeof meta.gio_sinh === "string" ? meta.gio_sinh.trim() : "";
  const gt = meta.gioi_tinh;
  const gioi_tinh = gt === "nam" || gt === "nu" ? gt : null;
  if (!ngay_sinh || !gio_sinh || !gioi_tinh) return null;
  const range = validateProfileNgaySinhIso(ngay_sinh);
  if (!range.ok) return null;
  return { ngay_sinh, gio_sinh, gioi_tinh };
}

/** Writes birth (+ optional display name) to `profiles`; returns error message or null. */
export async function applyBirthToProfile(
  uid: string,
  fields: SignupBirthFields,
  displayName?: string | null,
): Promise<string | null> {
  const patch = {
    display_name: displayName?.trim() || undefined,
    ngay_sinh: fields.ngay_sinh,
    gio_sinh: fields.gio_sinh,
    gioi_tinh: fields.gioi_tinh,
  };
  const { error } = await supabase.from("profiles").update(patch).eq("id", uid);
  if (error) return error.message;

  void supabase.auth.updateUser({
    data: { ngay_sinh: null, gio_sinh: null, gioi_tinh: null },
  });
  window.dispatchEvent(new Event("ngaytot:profile-refresh"));
  return null;
}

/**
 * After email signup, birth may exist only in `user_metadata` until the user
 * submits `/dang-ky` again. Copy to `profiles` so login skips the duplicate form.
 */
export async function syncSignupBirthMetadataToProfile(
  user: User,
): Promise<boolean> {
  const fields = parseSignupBirthFromMetadata(
    user.user_metadata as Record<string, unknown> | undefined,
  );
  if (!fields) return false;

  const { data: prof } = await supabase
    .from("profiles")
    .select("ngay_sinh, gio_sinh, gioi_tinh")
    .eq("id", user.id)
    .maybeSingle();

  if (profileHasBirthChartInput(prof as PostLoginProfile | null)) {
    return false;
  }

  const err = await applyBirthToProfile(
    user.id,
    fields,
    displayNameFromAuthUser(user),
  );
  return err == null;
}
