import { describe, expect, it } from "vitest";

import { DAY_LUAN_MAX_FOLLOW_UPS } from "~/lib/day-luan-chat";

describe("day-luan-chat constants", () => {
  it("matches server MAX_DAY_LUAN_FOLLOW_UPS", async () => {
    const { MAX_DAY_LUAN_FOLLOW_UPS } = await import(
      "../../supabase/functions/_shared/day-luan-thread"
    );
    expect(DAY_LUAN_MAX_FOLLOW_UPS).toBe(MAX_DAY_LUAN_FOLLOW_UPS);
  });
});
