import type { TuTruIntent } from "~/lib/api-types";

export type ChonNgayKetQuaState = {
  intent: TuTruIntent;
  intentLabel: string;
  rangeStart: string;
  rangeEnd: string;
  daysInclusive: number;
  payload: unknown;
};
