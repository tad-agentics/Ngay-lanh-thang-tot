import { describe, expect, it } from "vitest";

import { subscriptionActiveForReading } from "../../supabase/functions/_shared/generate-reading-guards.ts";

describe("subscriptionActiveForReading", () => {
  it("returns false for null or past expiry", () => {
    expect(subscriptionActiveForReading(null)).toBe(false);
    expect(subscriptionActiveForReading("2020-01-01T00:00:00.000Z")).toBe(false);
  });

  it("returns true when expiry is in the future", () => {
    const future = new Date(Date.now() + 864e5).toISOString();
    expect(subscriptionActiveForReading(future)).toBe(true);
  });
});
