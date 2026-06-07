import { describe, expect, it } from "vitest";
import {
  bodyHasBirthDate,
  isPersonalizedCalendarBody,
} from "./bat-tu-cache-policy.ts";

describe("bat-tu-cache-policy", () => {
  it("generic day-detail without birth is not personalized", () => {
    expect(
      isPersonalizedCalendarBody("day-detail", {
        date: "01/06/2026",
        mode: "generic",
      }),
    ).toBe(false);
  });

  it("day-detail with birth is personalized", () => {
    expect(
      isPersonalizedCalendarBody("day-detail", {
        date: "01/06/2026",
        birth_date: "01/01/1990",
      }),
    ).toBe(true);
  });

  it("ngay-hom-nay with birth is personalized", () => {
    expect(
      isPersonalizedCalendarBody("ngay-hom-nay", {
        birth_date: "01/01/1990",
      }),
    ).toBe(true);
  });

  it("bodyHasBirthDate", () => {
    expect(bodyHasBirthDate({ birth_date: "01/01/1990" })).toBe(true);
    expect(bodyHasBirthDate({ birth_date: "" })).toBe(false);
    expect(bodyHasBirthDate({})).toBe(false);
  });
});
