import { describe, expect, it } from "vitest";

import { laSoJsonToRevealProps, profileHasLaso } from "./la-so-ui";

describe("profileHasLaso", () => {
  it("is false for empty object", () => {
    expect(profileHasLaso({})).toBe(false);
  });

  it("is true for non-empty object", () => {
    expect(profileHasLaso({ nhat_chu: "Giáp" })).toBe(true);
  });
});

describe("laSoJsonToRevealProps", () => {
  it("reads snake_case keys", () => {
    const p = laSoJsonToRevealProps({
      nhat_chu: "Ất",
      nhat_chu_han: "乙",
      hanh: "Mộc",
      menh: "Đại Khê Thủy",
      dung_than: "Hỏa",
      ky_than: "Kim",
      dai_van: "Bính Tuất (2024–2034)",
    });
    expect(p?.nhatChu).toBe("Ất");
    expect(p?.nhatChuHan).toBe("乙");
    expect(p?.dungThan).toBe("Hỏa");
  });
});
