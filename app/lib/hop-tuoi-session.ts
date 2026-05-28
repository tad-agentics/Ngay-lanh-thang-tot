import type { HopTuoiPanelView } from "~/lib/hop-tuoi-result";

export type HopTuoiKetQuaState = {
  panel: HopTuoiPanelView;
  payload: unknown;
  otherName: string;
  selfName: string;
  purposeLabel?: string;
};

const STORAGE_KEY = "ngaytot.hop-tuoi.ket-qua.v1";
const MAX_BYTES = 480_000;

export function persistHopTuoiKetQua(state: HopTuoiKetQuaState): void {
  try {
    const raw = JSON.stringify(state);
    if (raw.length > MAX_BYTES) return;
    sessionStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // ignore quota / private mode
  }
}

export function loadHopTuoiKetQua(): HopTuoiKetQuaState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HopTuoiKetQuaState;
    if (!parsed?.panel || typeof parsed.selfName !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearHopTuoiKetQua(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
