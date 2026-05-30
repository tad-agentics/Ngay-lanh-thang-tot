import { beforeEach, describe, expect, it } from "vitest";

import {
  appendReturnToQuery,
  consumePendingReturnTo,
  destinationAfterAuth,
  destinationAfterOnboarding,
  readPendingReturnTo,
  returnToFromSearchParams,
  stashPendingReturnTo,
} from "./pending-return-to";

describe("pending-return-to", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("reads return_to and legacy returnTo query params", () => {
    expect(
      returnToFromSearchParams(new URLSearchParams("return_to=/lich")),
    ).toBe("/lich");
    expect(
      returnToFromSearchParams(new URLSearchParams("returnTo=/tra-cuu")),
    ).toBe("/tra-cuu");
    expect(
      returnToFromSearchParams(new URLSearchParams("return_to=https://evil")),
    ).toBeNull();
  });

  it("stashes and consumes whitelisted paths", () => {
    stashPendingReturnTo("/tra-cuu");
    expect(consumePendingReturnTo()).toBe("/tra-cuu");
    expect(consumePendingReturnTo()).toBeNull();
  });

  it("routes after auth when onboarding is complete", () => {
    stashPendingReturnTo("/tra-cuu");
    expect(destinationAfterAuth(true)).toBe("/tra-cuu");
    expect(readPendingReturnTo()).toBeNull();
  });

  it("keeps pending return_to through first-run", () => {
    stashPendingReturnTo("/lich/thang");
    expect(destinationAfterAuth(false, true)).toBe("/dang-dung-lich");
    expect(destinationAfterOnboarding()).toBe("/lich/thang");
  });

  it("sends incomplete birth chart input to dang-ky", () => {
    expect(destinationAfterAuth(false, false)).toBe("/dang-ky");
  });

  it("appends return_to to hrefs", () => {
    expect(appendReturnToQuery("/dang-ky", "/lich")).toBe(
      "/dang-ky?return_to=%2Flich",
    );
    expect(appendReturnToQuery("/dang-ky?ref=ABC", "/lich")).toBe(
      "/dang-ky?ref=ABC&return_to=%2Flich",
    );
  });
});
