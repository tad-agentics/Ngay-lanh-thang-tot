import { describe, expect, it } from "vitest";

import {
  canAccessPaidCalendar,
  canPeekTodayLuanReading,
  effectiveChatQuotaRemaining,
  hasOnboardingTrialAccess,
  isOnboardingTrialExhausted,
  isCalendarTeaserEligible,
  isNeverSubscribedUser,
  isNewUserDayLuanTeaser,
  isOnboardingTrialChatMode,
  isSubscriptionLapsed,
  neverSubFreeDayReading,
  onboardingTrialQuestionsRemaining,
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

describe("isCalendarTeaserEligible", () => {
  it("true for never-subscribed", () => {
    expect(
      isCalendarTeaserEligible({
        subscription_expires_at: null,
        bazi_reading_unlocked_at: null,
        tieu_van_reading_expires_at: null,
      }),
    ).toBe(true);
  });

  it("true for lapsed subscription", () => {
    expect(
      isCalendarTeaserEligible({
        subscription_expires_at: "2020-01-01T00:00:00Z",
        bazi_reading_unlocked_at: null,
        tieu_van_reading_expires_at: null,
      }),
    ).toBe(true);
  });

  it("false while subscription is active", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(
      isCalendarTeaserEligible({
        subscription_expires_at: future,
        bazi_reading_unlocked_at: null,
        tieu_van_reading_expires_at: null,
      }),
    ).toBe(false);
  });
});

describe("canPeekTodayLuanReading", () => {
  const neverSub = {
    subscription_expires_at: null,
    bazi_reading_unlocked_at: null,
    tieu_van_reading_expires_at: null,
  };
  const lapsed = {
    subscription_expires_at: "2020-01-01T00:00:00Z",
    bazi_reading_unlocked_at: null,
    tieu_van_reading_expires_at: null,
  };

  it("true for never-sub on today", () => {
    expect(canPeekTodayLuanReading(neverSub, "2026-06-01", "2026-06-01")).toBe(
      true,
    );
  });

  it("true for lapsed subscriber on today", () => {
    expect(canPeekTodayLuanReading(lapsed, "2026-06-01", "2026-06-01")).toBe(
      true,
    );
  });

  it("false for lapsed on other days", () => {
    expect(canPeekTodayLuanReading(lapsed, "2026-06-02", "2026-06-01")).toBe(
      false,
    );
  });

  it("false while subscription is active", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(
      canPeekTodayLuanReading(
        {
          subscription_expires_at: future,
          bazi_reading_unlocked_at: null,
          tieu_van_reading_expires_at: null,
        },
        "2026-06-01",
        "2026-06-01",
      ),
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

describe("onboarding trial questions", () => {
  const neverSub = {
    subscription_expires_at: null,
    bazi_reading_unlocked_at: null,
    tieu_van_reading_expires_at: null,
    onboarding_trial_questions_used: 0,
  };

  it("grants 5 remaining for new never-sub users", () => {
    expect(onboardingTrialQuestionsRemaining(neverSub)).toBe(5);
    expect(hasOnboardingTrialAccess(neverSub)).toBe(true);
    expect(canAccessPaidCalendar(neverSub)).toBe(true);
  });

  it("blocks when trial quota is exhausted", () => {
    const exhausted = { ...neverSub, onboarding_trial_questions_used: 5 };
    expect(onboardingTrialQuestionsRemaining(exhausted)).toBe(0);
    expect(hasOnboardingTrialAccess(exhausted)).toBe(false);
    expect(canAccessPaidCalendar(exhausted)).toBe(false);
    expect(isOnboardingTrialExhausted(exhausted)).toBe(true);
    expect(isOnboardingTrialExhausted(neverSub)).toBe(false);
  });

  it("does not grant trial to lapsed subscribers", () => {
    const lapsed = {
      subscription_expires_at: "2020-01-01T00:00:00Z",
      bazi_reading_unlocked_at: null,
      tieu_van_reading_expires_at: null,
      onboarding_trial_questions_used: 0,
    };
    expect(hasOnboardingTrialAccess(lapsed)).toBe(false);
    expect(canAccessPaidCalendar(lapsed)).toBe(false);
  });
});

describe("effectiveChatQuotaRemaining", () => {
  const neverSub = {
    subscription_expires_at: null,
    bazi_reading_unlocked_at: null,
    tieu_van_reading_expires_at: null,
    onboarding_trial_questions_used: 2,
  };

  it("caps daily pool by trial remaining for never-sub", () => {
    expect(effectiveChatQuotaRemaining(neverSub, 10)).toBe(3);
    expect(isOnboardingTrialChatMode(neverSub)).toBe(true);
  });

  it("returns 0 for never-sub with exhausted trial", () => {
    expect(
      effectiveChatQuotaRemaining(
        {
          subscription_expires_at: null,
          bazi_reading_unlocked_at: null,
          tieu_van_reading_expires_at: null,
          onboarding_trial_questions_used: 5,
        },
        10,
      ),
    ).toBe(0);
  });

  it("returns daily pool for subscribers", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(
      effectiveChatQuotaRemaining(
        {
          subscription_expires_at: future,
          bazi_reading_unlocked_at: null,
          tieu_van_reading_expires_at: null,
          onboarding_trial_questions_used: 0,
        },
        7,
      ),
    ).toBe(7);
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
