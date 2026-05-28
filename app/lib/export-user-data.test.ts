import { describe, expect, it } from "vitest";

import { buildUserDataExport } from "~/lib/export-user-data";
import type { SavedPick } from "~/hooks/useSavedPicks";
import type { Profile } from "~/lib/profile-context";

const profile = {
  id: "u1",
  display_name: "An",
  email: "an@example.com",
  ngay_sinh: "1990-05-15",
  gio_sinh: "05:00",
  gioi_tinh: "nam",
  la_so: { pillars: [] },
} as unknown as Profile;

const picks: SavedPick[] = [
  {
    id: "p1",
    saved_at: "2026-05-01T00:00:00Z",
    source_endpoint: "chon-ngay",
    payload: { day: "2026-06-01" },
    label: "Cưới",
    day_iso: "2026-06-01",
    score: 92,
  },
];

describe("buildUserDataExport", () => {
  it("includes profile fields and saved picks", () => {
    const out = buildUserDataExport(profile, picks);
    expect(out.profile.display_name).toBe("An");
    expect(out.profile.la_so).toEqual({ pillars: [] });
    expect(out.saved_picks).toHaveLength(1);
    expect(out.saved_picks[0]?.label).toBe("Cưới");
    expect(out.exported_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
