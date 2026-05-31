import { describe, expect, it } from "vitest";

import { generateReadingFunctionName } from "./generate-reading-functions";

describe("generateReadingFunctionName", () => {
  it("routes day endpoints to generate-reading-day", () => {
    expect(generateReadingFunctionName("ngay-hom-nay")).toBe(
      "generate-reading-day",
    );
    expect(generateReadingFunctionName("day-detail")).toBe(
      "generate-reading-day",
    );
    expect(generateReadingFunctionName("hop-tuoi")).toBe("generate-reading-day");
  });

  it("routes la-so endpoints to generate-reading-la-so", () => {
    expect(generateReadingFunctionName("la-so-chi-tiet")).toBe(
      "generate-reading-la-so",
    );
    expect(generateReadingFunctionName("phong-thuy")).toBe(
      "generate-reading-la-so",
    );
  });

  it("routes tieu-van to generate-reading-tieu-van", () => {
    expect(generateReadingFunctionName("tieu-van")).toBe(
      "generate-reading-tieu-van",
    );
  });

  it("routes luu-nien to generate-reading-luu-nien", () => {
    expect(generateReadingFunctionName("luu-nien")).toBe(
      "generate-reading-luu-nien",
    );
  });

  it("throws for unknown endpoints", () => {
    expect(() => generateReadingFunctionName("unknown")).toThrow(
      "Unknown generate-reading endpoint",
    );
  });
});
