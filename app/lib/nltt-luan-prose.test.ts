import { describe, expect, it } from "vitest";

import { sanitizeNlttLuanProse } from "~/lib/nltt-luan-prose";

describe("sanitizeNlttLuanProse", () => {
  it("removes greeting and markdown section headers", () => {
    const raw = `Chào bạn, đây là những luận giải chi tiết về lá số của bạn.

**Tổng quan tính cách**
Bạn mang nét tính cách của hành Mộc.

**Sự nghiệp và tài vận**
Xu hướng nghề nghiệp thuận với hành Mộc.`;

    const out = sanitizeNlttLuanProse(raw);
    expect(out).not.toMatch(/chào bạn/i);
    expect(out).not.toMatch(/\*\*/);
    expect(out).not.toContain("Tổng quan tính cách");
    expect(out).toContain("Bạn mang nét tính cách");
    expect(out).toContain("Xu hướng nghề nghiệp");
  });

  it("strips leading bold section label before body text", () => {
    const raw = "**Tổng quan** Bạn là người Ất Mộc.";
    expect(sanitizeNlttLuanProse(raw)).toBe("Bạn là người Ất Mộc.");
  });
});
