import { describe, expect, it } from "vitest";

import { isStaleAuthSessionError } from "./auth-stale-session";

describe("isStaleAuthSessionError", () => {
  it("matches refresh token not found", () => {
    expect(
      isStaleAuthSessionError(
        "Invalid Refresh Token: Refresh Token Not Found",
      ),
    ).toBe(true);
  });

  it("matches jwt expired", () => {
    expect(isStaleAuthSessionError("JWT expired")).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(isStaleAuthSessionError("Network request failed")).toBe(false);
    expect(isStaleAuthSessionError(null)).toBe(false);
  });
});
