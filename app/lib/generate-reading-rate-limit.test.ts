import { describe, expect, it } from "vitest";

import { isGenerateReadingRateLimitedBody } from "./generate-reading";

describe("isGenerateReadingRateLimitedBody", () => {
  it("detects legacy 503-style rate limit envelope", () => {
    expect(
      isGenerateReadingRateLimitedBody({
        reading: null,
        error: {
          code: "RATE_LIMIT_UNAVAILABLE",
          message: "Thử lại sau vài giây.",
        },
      }),
    ).toBe(true);
  });

  it("returns false for empty success body", () => {
    expect(isGenerateReadingRateLimitedBody({ reading: null })).toBe(false);
  });

  it("returns false for unrelated errors", () => {
    expect(
      isGenerateReadingRateLimitedBody({
        error: { code: "SUB_EXPIRED", message: "Hết hạn" },
      }),
    ).toBe(false);
  });
});
