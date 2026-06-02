import { describe, expect, it } from "vitest";

import {
  buildLandingOpenCalendarHref,
  buildLandingSignUpHref,
} from "~/lib/landing-entry";

describe("buildLandingSignUpHref", () => {
  it("returns /dang-ky without referral", () => {
    expect(buildLandingSignUpHref()).toBe("/dang-ky");
  });

  it("appends ref query", () => {
    expect(buildLandingSignUpHref("ABC12")).toBe("/dang-ky?ref=ABC12");
  });
});

describe("buildLandingOpenCalendarHref", () => {
  it("routes to login with return_to lich", () => {
    expect(buildLandingOpenCalendarHref()).toBe(
      "/dang-nhap?return_to=%2Flich",
    );
  });

  it("keeps referral on login href", () => {
    expect(buildLandingOpenCalendarHref("ABC12")).toBe(
      "/dang-nhap?ref=ABC12&return_to=%2Flich",
    );
  });
});
