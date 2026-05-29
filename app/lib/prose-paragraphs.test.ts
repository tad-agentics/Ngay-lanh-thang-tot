import { describe, expect, it } from "vitest";

import { paragraphSpansInText } from "~/lib/prose-paragraphs";

function joinSpans(text: string, spans: ReturnType<typeof paragraphSpansInText>) {
  return spans.map((s) => text.slice(s.start, s.end));
}

describe("paragraphSpansInText", () => {
  it("groups sentences into pairs by default", () => {
    const text =
      "Câu một về ngày tốt. Câu hai về giờ vàng. Câu ba về tránh việc xấu. Câu bốn kết luận.";
    const parts = joinSpans(text, paragraphSpansInText(text));
    expect(parts).toHaveLength(2);
    expect(parts[0]).toContain("Câu một");
    expect(parts[0]).toContain("Câu hai");
    expect(parts[1]).toContain("Câu ba");
    expect(parts[1]).toContain("Câu bốn");
  });

  it("respects explicit blank-line breaks", () => {
    const text = "Đoạn một.\n\nĐoạn hai.";
    const parts = joinSpans(text, paragraphSpansInText(text));
    expect(parts).toEqual(["Đoạn một.", "Đoạn hai."]);
  });

  it("returns one span for prose without sentence breaks", () => {
    const text = "Một dòng không có dấu chấm";
    expect(paragraphSpansInText(text)).toEqual([{ start: 0, end: text.length }]);
  });
});
