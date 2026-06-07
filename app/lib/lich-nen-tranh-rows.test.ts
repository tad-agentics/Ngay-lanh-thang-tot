import { describe, expect, it } from "vitest";

import {
  buildLichNenTranhRows,
  formatNenTeaser,
  formatTranhTeaser,
} from "~/lib/lich-nen-tranh-rows";

describe("formatNenTeaser", () => {
  it("returns em dash when empty", () => {
    expect(formatNenTeaser([])).toBe("—");
  });

  it("handles single item with follow-up hint", () => {
    expect(formatNenTeaser(["Khai trương"])).toContain("Khai trương");
    expect(formatNenTeaser(["Khai trương"])).toContain("hỏi tiếp");
  });

  it("shows count and preview for many items", () => {
    const labels = [
      "Lễ ăn hỏi",
      "An táng",
      "Cải táng",
      "Cắt tóc",
      "Cầu tài lộc",
    ];
    const out = formatNenTeaser(labels);
    expect(out).toContain("5 việc thuận");
    expect(out).toContain("Lễ ăn hỏi");
    expect(out).not.toContain("Cầu tài lộc");
  });
});

describe("formatTranhTeaser", () => {
  it("returns em dash when empty", () => {
    expect(formatTranhTeaser([])).toBe("—");
  });

  it("handles single avoid item", () => {
    const out = formatTranhTeaser(["Phẫu thuật"]);
    expect(out).toContain("Phẫu thuật");
    expect(out).toContain("danh sách tránh");
  });

  it("steers to follow-up for long avoid list", () => {
    const labels = Array.from({ length: 20 }, (_, i) => `Việc ${i + 1}`);
    const out = formatTranhTeaser(labels);
    expect(out).toBe(
      "20 việc nên tránh — hỏi tiếp xem việc bạn định làm có phù hợp ngày này",
    );
    expect(out).not.toContain("Việc 1");
  });
});

describe("buildLichNenTranhRows", () => {
  it("builds three rows with gio tot", () => {
    const rows = buildLichNenTranhRows({
      goodFor: ["A", "B"],
      avoidFor: ["X"],
      gioTot: "Thìn 7–9h",
    });
    expect(rows).toHaveLength(3);
    expect(rows[2]?.value).toBe("Thìn 7–9h");
  });
});
