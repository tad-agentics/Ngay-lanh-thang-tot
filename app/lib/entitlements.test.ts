import { describe, expect, it } from "vitest";

import {
  isNeverSubscribedUser,
  isNewUserDayLuanTeaser,
  isSubscriptionLapsed,
  neverSubFreeDayReading,
  subscriptionActive,
} from "./entitlements";

describe("isNeverSubscribedUser", () => {
  it("true when subscription_expires_at is null", () => {
    expect(
      isNeverSubscribedUser({
        subscription_expires_at: null,
        bazi_reading_unlocked_at: null,
        tieu_van_reading_expires_at: null,
      }),
    ).toBe(true);
  });

  it("false when user had a subscription window", () => {
    expect(
      isNeverSubscribedUser({
        subscription_expires_at: "2020-01-01T00:00:00Z",
        bazi_reading_unlocked_at: null,
        tieu_van_reading_expires_at: null,
      }),
    ).toBe(false);
  });
});

describe("isSubscriptionLapsed", () => {
  it("false for never-subscribed", () => {
    expect(
      isSubscriptionLapsed({
        subscription_expires_at: null,
        bazi_reading_unlocked_at: null,
        tieu_van_reading_expires_at: null,
      }),
    ).toBe(false);
  });

  it("true when subscription window is in the past", () => {
    expect(
      isSubscriptionLapsed({
        subscription_expires_at: "2020-01-01T00:00:00Z",
        bazi_reading_unlocked_at: null,
        tieu_van_reading_expires_at: null,
      }),
    ).toBe(true);
  });

  it("false while subscription is active", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(
      isSubscriptionLapsed({
        subscription_expires_at: future,
        bazi_reading_unlocked_at: null,
        tieu_van_reading_expires_at: null,
      }),
    ).toBe(false);
  });
});

describe("neverSubFreeDayReading", () => {
  const neverSub = {
    subscription_expires_at: null,
    bazi_reading_unlocked_at: null,
    tieu_van_reading_expires_at: null,
  };

  it("true for never-sub on today's iso", () => {
    expect(neverSubFreeDayReading(neverSub, "2026-06-01", "2026-06-01")).toBe(
      true,
    );
  });

  it("false for other days", () => {
    expect(neverSubFreeDayReading(neverSub, "2026-06-02", "2026-06-01")).toBe(
      false,
    );
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
