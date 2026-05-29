import { describe, expect, it } from "vitest";

import {
  isRedirectUrlAllowed,
  normalizeAppOrigin,
} from "../../supabase/functions/_shared/allowed-origin.ts";

describe("normalizeAppOrigin", () => {
  it("returns origin for a valid app URL", () => {
    expect(normalizeAppOrigin("https://ngaylanhthangtot.vn")).toBe(
      "https://ngaylanhthangtot.vn",
    );
    expect(normalizeAppOrigin("http://localhost:5173/")).toBe(
      "http://localhost:5173",
    );
  });

  it("rejects wildcard and empty", () => {
    expect(normalizeAppOrigin("*")).toBeNull();
    expect(normalizeAppOrigin("")).toBeNull();
    expect(normalizeAppOrigin(undefined)).toBeNull();
  });
});

describe("isRedirectUrlAllowed", () => {
  const prod = "https://ngaylanhthangtot.vn";

  it("allows paths on the allowed origin", () => {
    expect(
      isRedirectUrlAllowed(
        "https://ngaylanhthangtot.vn/dat-lich/xac-nhan",
        prod,
      ),
    ).toBe(true);
  });

  it("rejects other origins and open redirects", () => {
    expect(
      isRedirectUrlAllowed("https://evil.example/phish", prod),
    ).toBe(false);
    expect(isRedirectUrlAllowed("http://ngaylanhthangtot.vn/ok", prod)).toBe(
      false,
    );
  });

  it("rejects when allowlist is unset", () => {
    expect(
      isRedirectUrlAllowed("https://ngaylanhthangtot.vn/dat-lich", null),
    ).toBe(false);
  });
});
