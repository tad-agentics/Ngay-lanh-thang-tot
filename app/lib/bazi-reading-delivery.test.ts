import { describe, expect, it } from "vitest";

import { BAZI_READING_DELIVERY_CONTENT_VERSION } from "~/lib/bazi-reading-content-version";
import { normalizeLaSoSectionsInput } from "~/lib/generate-reading";
import {
  baziReadingBirthRevision,
  baziReadingCacheRevision,
} from "~/lib/bazi-reading-session";

describe("baziReadingBirthRevision", () => {
  it("stable per birth profile fields", () => {
    const p = {
      ngay_sinh: "1990-01-15",
      gio_sinh: "8",
      gioi_tinh: "nam" as const,
      birth_data_locked_at: "2026-01-01T00:00:00Z",
    };
    expect(baziReadingBirthRevision(p)).toBe(
      "1990-01-15\x1e8\x1enam\x1e2026-01-01T00:00:00Z",
    );
    expect(baziReadingCacheRevision(p, 2026)).toContain("2026");
    expect(baziReadingCacheRevision(p, 2026)).toContain(
      baziReadingBirthRevision(p),
    );
  });
});

describe("BAZI_READING_DELIVERY_CONTENT_VERSION", () => {
  it("bumps when full Bát Tự luận shape changes", () => {
    expect(BAZI_READING_DELIVERY_CONTENT_VERSION).toMatch(/^2026-/);
    expect(BAZI_READING_DELIVERY_CONTENT_VERSION.length).toBeGreaterThan(8);
  });
});

describe("delivery sections round-trip", () => {
  it("normalizes sections for storage shape", () => {
    const sections = normalizeLaSoSectionsInput([
      { id: "menh_tong_quan", title: "Mệnh", text: "Đoạn luận đủ dài." },
    ]);
    expect(sections[0]?.id).toBe("menh_tong_quan");
  });

  it("keeps full Bát Tự bundle section count (no 10-cap)", () => {
    const rows = Array.from({ length: 14 }, (_, i) => ({
      id: `section_${i}`,
      title: `S${i}`,
      text: `Luận ${i}.`,
    }));
    const sections = normalizeLaSoSectionsInput(rows);
    expect(sections).toHaveLength(14);
  });
});
