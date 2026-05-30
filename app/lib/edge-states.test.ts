import { describe, expect, it } from "vitest";

import {
  subscriptionDaysUntil,
  subscriptionExpiryUrgent,
} from "~/lib/entitlements";

describe("subscriptionExpiryUrgent (G2)", () => {
  it("flags within 7 days", () => {
    const inFiveDays = new Date();
    inFiveDays.setDate(inFiveDays.getDate() + 5);
    const iso = inFiveDays.toISOString();
    expect(subscriptionDaysUntil(iso)).toBeLessThanOrEqual(7);
    expect(subscriptionExpiryUrgent(iso)).toBe(true);
  });

  it("is false when expired", () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    expect(subscriptionExpiryUrgent(past.toISOString())).toBe(false);
  });
});
