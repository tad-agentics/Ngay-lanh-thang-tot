import { describe, expect, it } from "vitest";

import {
  expandOriginAllowlist,
  isRedirectUrlAllowed,
  normalizeAppOrigin,
  parseAllowedOriginsFromEnv,
  pickCorsAllowOrigin,
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

describe("expandOriginAllowlist", () => {
  it("pairs apex with www for production host", () => {
    const list = expandOriginAllowlist(["https://ngaylanhthangtot.vn"]);
    expect(list).toContain("https://ngaylanhthangtot.vn");
    expect(list).toContain("https://www.ngaylanhthangtot.vn");
  });

  it("does not add www for localhost", () => {
    const list = expandOriginAllowlist(["http://localhost:5173"]);
    expect(list).toEqual(["http://localhost:5173"]);
  });
});

describe("pickCorsAllowOrigin", () => {
  const allowlist = expandOriginAllowlist(["https://ngaylanhthangtot.vn"]);

  it("echoes www when request Origin is www", () => {
    expect(
      pickCorsAllowOrigin("https://www.ngaylanhthangtot.vn", allowlist),
    ).toBe("https://www.ngaylanhthangtot.vn");
  });

  it("echoes apex when request Origin is apex", () => {
    expect(
      pickCorsAllowOrigin("https://ngaylanhthangtot.vn", allowlist),
    ).toBe("https://ngaylanhthangtot.vn");
  });
});

describe("isRedirectUrlAllowed", () => {
  const allowlist = parseAllowedOriginsFromEnv(
    "https://ngaylanhthangtot.vn",
  );

  it("allows paths on apex and www", () => {
    expect(
      isRedirectUrlAllowed(
        "https://ngaylanhthangtot.vn/dat-lich/xac-nhan",
        allowlist,
      ),
    ).toBe(true);
    expect(
      isRedirectUrlAllowed(
        "https://www.ngaylanhthangtot.vn/dat-lich/xac-nhan",
        allowlist,
      ),
    ).toBe(true);
  });

  it("rejects other origins and open redirects", () => {
    expect(
      isRedirectUrlAllowed("https://evil.example/phish", allowlist),
    ).toBe(false);
    expect(
      isRedirectUrlAllowed("http://ngaylanhthangtot.vn/ok", allowlist),
    ).toBe(false);
  });

  it("rejects when allowlist is empty", () => {
    expect(
      isRedirectUrlAllowed("https://ngaylanhthangtot.vn/dat-lich", []),
    ).toBe(false);
  });
});
