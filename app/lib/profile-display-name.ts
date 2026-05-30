import type { User } from "@supabase/supabase-js";

import type { Profile } from "~/lib/profile-context";

function pickStr(x: unknown): string | null {
  if (typeof x !== "string") return null;
  const t = x.trim();
  return t.length > 0 ? t : null;
}

function nameFromEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const local = email.split("@")[0]?.trim();
  return local && local.length > 0 ? local : null;
}

/** Read a human name from Supabase Auth user (Google OAuth, email signup metadata). */
export function displayNameFromAuthUser(user: User | null | undefined): string | null {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  return (
    pickStr(meta.full_name) ??
    pickStr(meta.name) ??
    pickStr(meta.display_name) ??
    nameFromEmail(user.email)
  );
}

type ResolveOptions = {
  /** Shown when no name is available (default: em dash for maket empty state). */
  fallback?: string;
};

/** Prefer saved profile name, then auth metadata, then fallback. */
export function resolveProfileDisplayName(
  profile: Profile | null | undefined,
  user: User | null | undefined,
  options?: ResolveOptions,
): string {
  const fallback = options?.fallback ?? "—";
  const fromProfile = pickStr(profile?.display_name);
  if (fromProfile) return fromProfile;
  const fromAuth = displayNameFromAuthUser(user);
  if (fromAuth) return fromAuth;
  return fallback;
}
