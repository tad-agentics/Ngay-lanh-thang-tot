import { describe, expect, it } from "vitest";

import {
  birthEditLimitReached,
  birthEditsRemaining,
} from "./birth-edit-limit";

describe("birth-edit-limit", () => {
  it("starts with full quota when no prior edits", () => {
    expect(birthEditsRemaining(null)).toBe(2);
    expect(birthEditLimitReached(null)).toBe(false);
  });

  it("counts edits inside rolling 30-day window", () => {
    const profile = {
      birth_edit_count: 2,
      birth_edit_window_start: new Date().toISOString(),
    };
    expect(birthEditsRemaining(profile)).toBe(0);
    expect(birthEditLimitReached(profile)).toBe(true);
  });

  it("resets count outside 30-day window", () => {
    const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    const profile = {
      birth_edit_count: 2,
      birth_edit_window_start: old,
    };
    expect(birthEditsRemaining(profile)).toBe(2);
  });
});
