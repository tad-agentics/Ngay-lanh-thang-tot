import { describe, expect, it } from "vitest";

import { truncateMenhProsePreview } from "~/lib/menh-prose-preview";

describe("truncateMenhProsePreview", () => {
  it("keeps short prose intact", () => {
    expect(truncateMenhProsePreview("Một câu duy nhất.")).toBe("Một câu duy nhất.");
  });

  it("truncates after two sentences", () => {
    const prose =
      "Câu một về mệnh. Câu hai về vận. Câu ba không hiện trên home.";
    expect(truncateMenhProsePreview(prose)).toBe(
      "Câu một về mệnh. Câu hai về vận.…",
    );
  });
});
