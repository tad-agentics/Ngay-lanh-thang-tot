import { describe, expect, it } from "vitest";

import { isReadingUnlockGranted, type ReadingUnlockOk } from "~/lib/reading-unlock";

function ok(partial: Partial<ReadingUnlockOk>): ReadingUnlockOk {
  return {
    ok: true,
    charged: false,
    already_unlocked: false,
    ...partial,
  };
}

describe("isReadingUnlockGranted", () => {
  it("accepts subscription_free", () => {
    expect(
      isReadingUnlockGranted(
        ok({ subscription_free: true, unlocked: true }),
      ),
    ).toBe(true);
  });

  it("accepts already_unlocked ledger entry", () => {
    expect(
      isReadingUnlockGranted(
        ok({ already_unlocked: true, unlocked: true }),
      ),
    ).toBe(true);
  });

  it("rejects when not unlocked", () => {
    expect(isReadingUnlockGranted(ok({ unlocked: false }))).toBe(false);
  });
});
