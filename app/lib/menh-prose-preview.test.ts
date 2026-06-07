import { describe, expect, it } from "vitest";

import { truncateMenhProsePreview } from "~/lib/menh-prose-preview";

describe("truncateMenhProsePreview", () => {
  it("keeps short prose intact", () => {
    expect(truncateMenhProsePreview("Một câu duy nhất.")).toBe("Một câu duy nhất.");
  });

  it("truncates after three sentences by default", () => {
    const prose =
      "Câu một về mệnh. Câu hai về vận. Câu ba về nhịp. Câu bốn không hiện trên home.";
    expect(truncateMenhProsePreview(prose)).toBe(
      "Câu một về mệnh. Câu hai về vận. Câu ba về nhịp.…",
    );
  });
});
