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
  it("tracks menh length / prompt generation", () => {
    expect(BAZI_READING_DELIVERY_CONTENT_VERSION).toContain("menh");
    expect(BAZI_READING_DELIVERY_CONTENT_VERSION).toContain("1000");
  });
});

describe("delivery sections round-trip", () => {
  it("normalizes sections for storage shape", () => {
    const sections = normalizeLaSoSectionsInput([
      { id: "menh_tong_quan", title: "Mệnh", text: "Đoạn luận đủ dài." },
    ]);
    expect(sections[0]?.id).toBe("menh_tong_quan");
  });
});
