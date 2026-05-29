import { describe, expect, it } from "vitest";

import { menhOverviewFromLaSoSections } from "./bazi-reading-load";

describe("menhOverviewFromLaSoSections", () => {
  it("prefers menh_tong_quan", () => {
    expect(
      menhOverviewFromLaSoSections([
        { id: "menh_tong_quan", title: "Mệnh", text: "Tổng quan." },
        { id: "tinh_cach", title: "Tính cách", text: "Khác." },
      ]),
    ).toBe("Tổng quan.");
  });

  it("falls back to tong_hop then first section", () => {
    expect(
      menhOverviewFromLaSoSections([
        { id: "tong_hop", title: "Luận", text: "Fallback." },
      ]),
    ).toBe("Fallback.");
  });
});
