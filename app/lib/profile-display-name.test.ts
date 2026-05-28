import type { User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import type { Profile } from "~/lib/profile-context";
import {
  displayNameFromAuthUser,
  resolveProfileDisplayName,
} from "~/lib/profile-display-name";

function authUser(partial: Pick<User, "id" | "email"> & { user_metadata?: Record<string, unknown> }): User {
  return partial as unknown as User;
}

const baseProfile = {
  id: "u1",
  email: "a@b.com",
  display_name: null,
} as Profile;

describe("displayNameFromAuthUser", () => {
  it("reads Google-style full_name", () => {
    expect(
      displayNameFromAuthUser(
        authUser({
          id: "1",
          email: "x@gmail.com",
          user_metadata: { full_name: "Nguyễn Văn A" },
        }),
      ),
    ).toBe("Nguyễn Văn A");
  });

  it("falls back to email local part", () => {
    expect(
      displayNameFromAuthUser(
        authUser({
          id: "1",
          email: "ductrinh@gmail.com",
          user_metadata: {},
        }),
      ),
    ).toBe("ductrinh");
  });
});

describe("resolveProfileDisplayName", () => {
  it("prefers profile display_name", () => {
    expect(
      resolveProfileDisplayName(
        { ...baseProfile, display_name: "  Hà Thanh  " },
        null,
      ),
    ).toBe("Hà Thanh");
  });

  it("uses auth metadata when profile name missing", () => {
    expect(
      resolveProfileDisplayName(baseProfile, authUser({
        id: "1",
        email: "x@gmail.com",
        user_metadata: { name: "Test User" },
      })),
    ).toBe("Test User");
  });
});
