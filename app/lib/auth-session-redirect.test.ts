import { describe, expect, it } from "vitest";

import {
  consumeAuthRedirectReason,
  markManualSignOut,
  markSessionExpired,
  resetManualSignOutFlag,
} from "./auth-session-redirect";

describe("auth-session-redirect", () => {
  it("returns expired when session ends", () => {
    markSessionExpired();
    expect(consumeAuthRedirectReason()).toBe("expired");
    expect(consumeAuthRedirectReason()).toBeNull();
  });

  it("skips expired after manual sign-out", () => {
    markManualSignOut();
    markSessionExpired();
    resetManualSignOutFlag();
    expect(consumeAuthRedirectReason()).toBeNull();
  });
});
