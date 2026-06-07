import { describe, expect, it, beforeEach } from "vitest";

import type { ChonNgayKetQuaState } from "~/lib/chon-ngay-flow";
import {
  consumeTraCuuFormPreset,
  loadTraCuuEmpty,
  loadTraCuuFlow,
  loadTraCuuKetQua,
  persistTraCuuEmpty,
  persistTraCuuFlow,
  persistTraCuuKetQua,
} from "~/lib/tra-cuu-session";

const sampleKetQua: ChonNgayKetQuaState = {
  intent: "DAM_CUOI",
  intentLabel: "Đám cưới",
  rangeStart: "2026-06-01",
  rangeEnd: "2026-06-30",
  daysInclusive: 30,
  payload: { ranked_days: [{ date: "2026-06-06", score: 90 }] },
};

beforeEach(() => {
  sessionStorage.clear();
});

describe("tra-cuu-session", () => {
  it("persists and loads ket-qua state", () => {
    persistTraCuuKetQua(sampleKetQua);
    const loaded = loadTraCuuKetQua();
    expect(loaded?.intent).toBe("DAM_CUOI");
    expect(loaded?.payload).toEqual(sampleKetQua.payload);
  });

  it("persists empty state without payload", () => {
    const empty = {
      intent: sampleKetQua.intent,
      intentLabel: sampleKetQua.intentLabel,
      rangeStart: sampleKetQua.rangeStart,
      rangeEnd: sampleKetQua.rangeEnd,
      daysInclusive: sampleKetQua.daysInclusive,
    };
    persistTraCuuEmpty(empty);
    expect(loadTraCuuEmpty()?.rangeEnd).toBe("2026-06-30");
    expect(loadTraCuuKetQua()).toBeNull();
  });

  it("stores form preset on pick and consumes once on tra-cuu entry", () => {
    persistTraCuuKetQua(sampleKetQua);
    expect(consumeTraCuuFormPreset()?.daysInclusive).toBe(30);
    expect(consumeTraCuuFormPreset()).toBeNull();
  });

  it("persists flow state with intro and screen", () => {
    persistTraCuuFlow({
      ...sampleKetQua,
      intro: "Intro NLTT",
      filter: "weekend",
      screen: "results",
      selectedDayIso: "2026-06-06",
    });
    const loaded = loadTraCuuFlow();
    expect(loaded?.intro).toBe("Intro NLTT");
    expect(loaded?.filter).toBe("weekend");
    expect(loaded?.screen).toBe("results");
    expect(loaded?.selectedDayIso).toBe("2026-06-06");
    expect(loadTraCuuKetQua()?.payload).toEqual(sampleKetQua.payload);
  });
});
