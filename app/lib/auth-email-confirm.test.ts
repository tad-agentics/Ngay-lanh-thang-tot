import { beforeEach, describe, expect, it, vi } from "vitest";

const { resend } = vi.hoisted(() => ({
  resend: vi.fn(),
}));

vi.mock("~/lib/supabase", () => ({
  supabase: { auth: { resend } },
}));

import {
  parseEmailOtpType,
  resendSignupConfirmationEmail,
} from "~/lib/auth-email-confirm";

describe("parseEmailOtpType", () => {
  it("accepts signup and email", () => {
    expect(parseEmailOtpType("signup")).toBe("signup");
    expect(parseEmailOtpType("email")).toBe("email");
  });

  it("rejects unknown types", () => {
    expect(parseEmailOtpType("invalid")).toBeNull();
  });
});

describe("resendSignupConfirmationEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls resend with signup type and callback redirect", async () => {
    resend.mockResolvedValue({ error: null });
    const result = await resendSignupConfirmationEmail("user@example.com");
    expect(result.ok).toBe(true);
    expect(resend).toHaveBeenCalledWith({
      type: "signup",
      email: "user@example.com",
      options: { emailRedirectTo: expect.stringContaining("/auth/callback") },
    });
  });
});
