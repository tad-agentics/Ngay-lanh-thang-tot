import type { User } from "@supabase/supabase-js";

/** User already has a session — completing birth profile, not email sign-up. */
export function isCompletingAuthOnboarding(user: User | null | undefined): boolean {
  return user != null;
}

export function oauthProviderLabel(user: User | null | undefined): string | null {
  if (!user?.identities?.length) return null;
  const provider = user.identities.find((id) => id.provider !== "email")?.provider;
  if (!provider) return null;
  if (provider === "google") return "Google";
  return provider;
}

export function displayNameFromAuthUser(user: User | null | undefined): string {
  if (!user) return "";
  const meta = user.user_metadata;
  if (typeof meta?.full_name === "string" && meta.full_name.trim()) {
    return meta.full_name.trim();
  }
  if (typeof meta?.name === "string" && meta.name.trim()) {
    return meta.name.trim();
  }
  return "";
}

export function emailFromAuthUser(user: User | null | undefined): string {
  return user?.email?.trim() ?? "";
}
