import { describe, expect, it } from "vitest";

import {
  displayNameFromAuthUser,
  emailFromAuthUser,
  isCompletingAuthOnboarding,
  oauthProviderLabel,
} from "~/lib/auth-onboarding";

describe("auth-onboarding", () => {
  it("detects session-based onboarding", () => {
    expect(isCompletingAuthOnboarding(null)).toBe(false);
    expect(isCompletingAuthOnboarding({ id: "u1" } as never)).toBe(true);
  });

  it("reads Google metadata", () => {
    const user = {
      email: "a@b.com",
      user_metadata: { full_name: "Nguyễn A" },
      identities: [{ provider: "google" }],
    } as never;
    expect(displayNameFromAuthUser(user)).toBe("Nguyễn A");
    expect(emailFromAuthUser(user)).toBe("a@b.com");
    expect(oauthProviderLabel(user)).toBe("Google");
  });
});
