import { describe, expect, it } from "vitest";

import { isClientNetworkFailure } from "./generate-reading";

describe("isClientNetworkFailure", () => {
  it("detects Failed to fetch", () => {
    expect(isClientNetworkFailure(new TypeError("Failed to fetch"))).toBe(true);
  });

  it("detects Chrome ERR_NETWORK_IO_SUSPENDED", () => {
    expect(
      isClientNetworkFailure(new Error("net::ERR_NETWORK_IO_SUSPENDED")),
    ).toBe(true);
  });

  it("detects ERR_NETWORK_CHANGED", () => {
    expect(isClientNetworkFailure(new Error("net::ERR_NETWORK_CHANGED"))).toBe(
      true,
    );
  });

  it("returns false for unrelated errors", () => {
    expect(isClientNetworkFailure(new Error("Invalid JWT"))).toBe(false);
  });
});
