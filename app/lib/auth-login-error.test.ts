import { describe, expect, it } from "vitest";

import {
  isEmailNotConfirmed,
  isInvalidLoginCredentials,
  isUserAlreadyRegistered,
  mapAuthErrorMessageVi,
  readOauthCallbackError,
} from "./auth-login-error";

describe("auth-login-error", () => {
  it("detects invalid login credentials", () => {
    expect(isInvalidLoginCredentials("Invalid login credentials")).toBe(true);
    expect(isInvalidLoginCredentials("Something else")).toBe(false);
  });

  it("maps common Supabase messages to Vietnamese", () => {
    expect(mapAuthErrorMessageVi("Email not confirmed")).toContain("xác nhận");
    expect(mapAuthErrorMessageVi("User already registered")).toContain("đã có tài khoản");
    expect(mapAuthErrorMessageVi("Invalid login credentials")).toContain("Sai email");
  });

  it("detects email not confirmed and duplicate user", () => {
    expect(isEmailNotConfirmed("Email not confirmed")).toBe(true);
    expect(isUserAlreadyRegistered("User already registered")).toBe(true);
  });

  it("reads oauth error from search params", () => {
    const prev = window.location.href;
    window.history.replaceState({}, "", "/auth/callback?error=access_denied");
    expect(readOauthCallbackError()).toBe("Bạn đã hủy đăng nhập Google.");
    window.history.replaceState({}, "", prev);
  });
});
