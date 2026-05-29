import { describe, expect, it } from "vitest";

import { isReadingUnlockGranted, type ReadingUnlockOk } from "~/lib/reading-unlock";

function ok(partial: Partial<ReadingUnlockOk>): ReadingUnlockOk {
  return {
    ok: true,
    credits_balance: 0,
    charged: false,
    already_unlocked: false,
    ...partial,
  };
}

describe("isReadingUnlockGranted", () => {
  it("accepts subscription_free without ledger", () => {
    expect(
      isReadingUnlockGranted(
        ok({ subscription_free: true, unlocked: true, dry_run: true }),
      ),
    ).toBe(true);
  });

  it("accepts already_unlocked ledger entry", () => {
    expect(
      isReadingUnlockGranted(
        ok({ already_unlocked: true, unlocked: true, dry_run: true }),
      ),
    ).toBe(true);
  });

  it("rejects dry_run that still needs payment", () => {
    expect(
      isReadingUnlockGranted(
        ok({ unlocked: false, dry_run: true, credits_balance: 3 }),
      ),
    ).toBe(false);
  });

  it("accepts fresh paid unlock", () => {
    expect(
      isReadingUnlockGranted(
        ok({ unlocked: true, charged: true, credits_balance: 2 }),
      ),
    ).toBe(true);
  });
});
