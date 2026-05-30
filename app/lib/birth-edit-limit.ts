import type { Profile } from "~/lib/profile-context";

const DEFAULT_MAX_PER_30D = 2;
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export function birthEditsRemaining(
  profile: Pick<Profile, "birth_edit_count" | "birth_edit_window_start"> | null,
  maxPerWindow = DEFAULT_MAX_PER_30D,
): number {
  if (!profile) return maxPerWindow;
  const now = Date.now();
  const windowStart = profile.birth_edit_window_start
    ? new Date(profile.birth_edit_window_start).getTime()
    : null;
  const inWindow =
    windowStart != null &&
    !Number.isNaN(windowStart) &&
    now - windowStart < WINDOW_MS;
  const used = inWindow ? profile.birth_edit_count : 0;
  return Math.max(0, maxPerWindow - used);
}

export function birthEditLimitReached(
  profile: Pick<Profile, "birth_edit_count" | "birth_edit_window_start"> | null,
  maxPerWindow = DEFAULT_MAX_PER_30D,
): boolean {
  return birthEditsRemaining(profile, maxPerWindow) <= 0;
}
