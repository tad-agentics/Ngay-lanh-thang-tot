import { describe, expect, it } from "vitest";

import { extractDetailReasonLines } from "./chon-ngay-detail";

describe("extractDetailReasonLines", () => {
  it("reads reason_vi and layer3.breakdown from tu-tru-api detail", () => {
    const lines = extractDetailReasonLines({
      status: "success",
      reason_vi: "Trực Thành — ngày lành (+20).",
      layer3: {
        breakdown: [
          { source: "X", points: 1, reason_vi: "Một dòng giải thích." },
          { source: "Y", points: 2, reason_vi: "Hai dòng giải thích." },
        ],
      },
    });
    expect(lines.some((l) => l.includes("Trực Thành"))).toBe(true);
  });
});
