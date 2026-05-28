import { describe, expect, it } from "vitest";

import { shortenInlineReading } from "~/lib/inline-reading-text";

describe("shortenInlineReading", () => {
  it("keeps up to three sentences", () => {
    const long =
      "Câu một. Câu hai. Câu ba. Câu bốn. Câu năm.";
    expect(shortenInlineReading(long)).toBe("Câu một. Câu hai. Câu ba.");
  });

  it("caps total length with ellipsis", () => {
    const long =
      "Ngày Ất Mùi mang đến bầu không khí khá hanh thông nhờ sự hội tụ của trực Mãn và cát tinh Nguyệt Đức Hợp, tạo tiền đề thuận lợi cho những dự định khởi đầu mới. Tuy nhiên, sự xuất hiện của hung tinh Nguyệt Kỵ khiến cần thận trọng khi ký kết. Giờ Mùi chiều nay khá thuận cho họp mặt. Thêm một câu dư thừa không nên hiện.";
    const out = shortenInlineReading(long);
    expect(out.length).toBeLessThanOrEqual(260);
    expect(out.endsWith("…") || /[.!?]$/.test(out)).toBe(true);
  });
});
