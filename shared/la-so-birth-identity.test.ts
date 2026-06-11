import { describe, expect, it } from "vitest";

import {
  birthDateToIso,
  laSoMatchesBatTuBody,
  storedLaSoForMerge,
} from "./la-so-birth-identity.ts";

describe("la-so-birth-identity", () => {
  it("normalizes dd/mm/yyyy and ISO birth_date", () => {
    expect(birthDateToIso("07/10/2020")).toBe("2020-10-07");
    expect(birthDateToIso("2020-10-07")).toBe("2020-10-07");
    expect(birthDateToIso("2020-10-07T00:00:00Z")).toBe("2020-10-07");
  });

  it("matches when la_so and body share birth_date + birth_time", () => {
    const laSo = { birth_date: "2020-10-07", birth_time: 10 };
    const body = { birth_date: "07/10/2020", birth_time: 10 };
    expect(laSoMatchesBatTuBody(laSo, body)).toBe(true);
  });

  it("rejects stale la_so when birth_date differs", () => {
    const laSo = { birth_date: "1992-06-03", birth_time: 18 };
    const body = { birth_date: "07/10/2020", birth_time: 10 };
    expect(laSoMatchesBatTuBody(laSo, body)).toBe(false);
  });

  it("rejects when birth_time differs", () => {
    const laSo = { birth_date: "2020-10-07", birth_time: 18 };
    const body = { birth_date: "07/10/2020", birth_time: 10 };
    expect(laSoMatchesBatTuBody(laSo, body)).toBe(false);
  });

  it("rejects la_so missing birth metadata", () => {
    expect(
      laSoMatchesBatTuBody(
        { pillars: {} },
        { birth_date: "07/10/2020", birth_time: 10 },
      ),
    ).toBe(false);
  });

  it("coerces string birth_time on body", () => {
    const laSo = { birth_date: "2020-10-07", birth_time: 10 };
    expect(laSoMatchesBatTuBody(laSo, { birth_date: "07/10/2020", birth_time: "10" })).toBe(
      true,
    );
  });

  it("storedLaSoForMerge returns null when identity mismatches", () => {
    const laSo = { birth_date: "1992-06-03", birth_time: 18 };
    expect(
      storedLaSoForMerge(laSo, { birth_date: "07/10/2020", birth_time: 10 }),
    ).toBeNull();
  });
});
