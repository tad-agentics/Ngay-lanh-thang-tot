import { describe, expect, it } from "vitest";

import {
  isNeverSubscribedUser,
  isNewUserDayLuanTeaser,
  subscriptionActive,
} from "./entitlements";

describe("isNeverSubscribedUser", () => {
  it("true when subscription_expires_at is null", () => {
    expect(isNeverSubscribedUser({ subscription_expires_at: null })).toBe(true);
  });

  it("false when user had a subscription window", () => {
    expect(
      isNeverSubscribedUser({
        subscription_expires_at: "2020-01-01T00:00:00Z",
      }),
    ).toBe(false);
  });
});

describe("isNewUserDayLuanTeaser", () => {
  it("true only for never-subscribed without active calendar", () => {
    expect(
      isNewUserDayLuanTeaser({
        subscription_expires_at: null,
        bazi_reading_unlocked_at: null,
        tieu_van_reading_expires_at: null,
      }),
    ).toBe(true);
  });

  it("false for expired subscriber", () => {
    expect(
      isNewUserDayLuanTeaser({
        subscription_expires_at: "2020-01-01T00:00:00Z",
        bazi_reading_unlocked_at: null,
        tieu_van_reading_expires_at: null,
      }),
    ).toBe(false);
  });

  it("false when subscription still active", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(subscriptionActive(future)).toBe(true);
    expect(
      isNewUserDayLuanTeaser({
        subscription_expires_at: future,
        bazi_reading_unlocked_at: null,
        tieu_van_reading_expires_at: null,
      }),
    ).toBe(false);
  });
});
