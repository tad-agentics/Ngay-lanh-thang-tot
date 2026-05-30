import { describe, expect, it } from "vitest";

import { splitReadingAtHalf } from "./reading-teaser";

describe("splitReadingAtHalf", () => {
  it("splits near midpoint with sentence preference", () => {
    const text =
      "Câu một nói về ngày tốt. Câu hai bổ sung chi tiết. Câu ba kết luận ngắn.";
    const { visible, locked } = splitReadingAtHalf(text);
    expect(visible.length).toBeGreaterThan(0);
    expect(locked.length).toBeGreaterThan(0);
    expect(`${visible} ${locked}`.replace(/\s+/g, " ").trim()).toContain("Câu một");
    expect(locked).toContain("Câu ba");
  });
});
