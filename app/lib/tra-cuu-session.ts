import type { TuTruIntent } from "~/lib/api-types";
import type { ChonNgayKetQuaState } from "~/lib/chon-ngay-flow";

export type TraCuuEmptyState = Omit<ChonNgayKetQuaState, "payload">;

export type TraCuuFormPreset = {
  intent: TuTruIntent;
  daysInclusive: number;
  rangeStart: string;
  rangeEnd: string;
};

const KET_QUA_KEY = "ngaytot.tra-cuu.ket-qua.v1";
const EMPTY_KEY = "ngaytot.tra-cuu.empty.v1";
const FORM_KEY = "ngaytot.tra-cuu.form.v1";
const MAX_BYTES = 480_000;

function safeSet(key: string, value: unknown): void {
  try {
    const raw = JSON.stringify(value);
    if (raw.length > MAX_BYTES) return;
    sessionStorage.setItem(key, raw);
  } catch {
    // ignore quota / private mode
  }
}

function safeGet<T>(key: string, validate: (v: T) => boolean): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as T;
    return validate(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isKetQuaState(v: ChonNgayKetQuaState): boolean {
  return Boolean(v?.payload && v.intent && v.intentLabel && v.rangeStart && v.rangeEnd);
}

function isEmptyState(v: TraCuuEmptyState): boolean {
  return Boolean(v?.intent && v.intentLabel && v.rangeStart && v.rangeEnd);
}

function isFormPreset(v: TraCuuFormPreset): boolean {
  return Boolean(v?.intent && v.rangeStart && v.rangeEnd && v.daysInclusive > 0);
}

export function persistTraCuuKetQua(state: ChonNgayKetQuaState): void {
  safeSet(KET_QUA_KEY, state);
  persistTraCuuFormFromPick(state);
}

export function loadTraCuuKetQua(): ChonNgayKetQuaState | null {
  return safeGet(KET_QUA_KEY, isKetQuaState);
}

export function persistTraCuuEmpty(state: TraCuuEmptyState): void {
  safeSet(EMPTY_KEY, state);
  persistTraCuuFormFromPick(state);
}

export function loadTraCuuEmpty(): TraCuuEmptyState | null {
  return safeGet(EMPTY_KEY, isEmptyState);
}

function persistTraCuuFormFromPick(
  state: TraCuuEmptyState | ChonNgayKetQuaState,
): void {
  safeSet(FORM_KEY, {
    intent: state.intent,
    daysInclusive: state.daysInclusive,
    rangeStart: state.rangeStart,
    rangeEnd: state.rangeEnd,
  } satisfies TraCuuFormPreset);
}

export function consumeTraCuuFormPreset(): TraCuuFormPreset | null {
  try {
    const raw = sessionStorage.getItem(FORM_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(FORM_KEY);
    const parsed = JSON.parse(raw) as TraCuuFormPreset;
    return isFormPreset(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function peekTraCuuFormPreset(): TraCuuFormPreset | null {
  return safeGet(FORM_KEY, isFormPreset);
}
