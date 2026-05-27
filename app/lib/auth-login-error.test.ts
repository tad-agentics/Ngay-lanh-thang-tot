import { describe, expect, it } from "vitest";

import {
  isInvalidLoginCredentials,
  readOauthCallbackError,
} from "./auth-login-error";

describe("auth-login-error", () => {
  it("detects invalid login credentials", () => {
    expect(isInvalidLoginCredentials("Invalid login credentials")).toBe(true);
    expect(isInvalidLoginCredentials("Something else")).toBe(false);
  });

  it("reads oauth error from search params", () => {
    const prev = window.location.href;
    window.history.replaceState({}, "", "/auth/callback?error=access_denied");
    expect(readOauthCallbackError()).toBe("Bạn đã hủy đăng nhập Google.");
    window.history.replaceState({}, "", prev);
  });
});
