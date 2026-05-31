import { describe, expect, it } from "vitest";

import { normalizeLaSoSectionsInput } from "~/lib/generate-reading";

describe("normalizeLaSoSections section limits", () => {
  const row = (id: string) => ({
    id,
    title: id,
    text: `Luận ${id}.`,
  });

  it("caps tieu-van style responses at 10 sections", () => {
    const rows = Array.from({ length: 12 }, (_, i) => row(`tieu_${i}`));
    expect(normalizeLaSoSectionsInput(rows, 10)).toHaveLength(10);
  });

  it("allows Bát Tự bundle up to 32 sections", () => {
    const rows = Array.from({ length: 14 }, (_, i) => row(`bazi_${i}`));
    expect(normalizeLaSoSectionsInput(rows, 32)).toHaveLength(14);
  });
});
