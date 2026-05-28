import type { SavedPick } from "~/hooks/useSavedPicks";
import type { Profile } from "~/lib/profile-context";

export type UserDataExport = {
  exported_at: string;
  profile: {
    display_name: string | null;
    email: string | null;
    ngay_sinh: string | null;
    gio_sinh: string | null;
    gioi_tinh: string | null;
    la_so: unknown;
  };
  saved_picks: Array<{
    id: string;
    saved_at: string;
    source_endpoint: string;
    label: string | null;
    day_iso: string | null;
    score: number | null;
    payload: unknown;
  }>;
};

export function buildUserDataExport(
  profile: Profile,
  picks: SavedPick[],
): UserDataExport {
  return {
    exported_at: new Date().toISOString(),
    profile: {
      display_name: profile.display_name,
      email: profile.email,
      ngay_sinh: profile.ngay_sinh,
      gio_sinh: profile.gio_sinh,
      gioi_tinh: profile.gioi_tinh,
      la_so: profile.la_so,
    },
    saved_picks: picks.map((p) => ({
      id: p.id,
      saved_at: p.saved_at,
      source_endpoint: p.source_endpoint,
      label: p.label,
      day_iso: p.day_iso,
      score: p.score,
      payload: p.payload,
    })),
  };
}

export function downloadUserDataJson(
  profile: Profile,
  picks: SavedPick[],
): void {
  const payload = buildUserDataExport(profile, picks);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ngaytot-du-lieu-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
