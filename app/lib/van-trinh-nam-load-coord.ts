let screenLoadActive = false;

export function setVanTrinhNamScreenLoadActive(active: boolean): void {
  screenLoadActive = active;
}

export function isVanTrinhNamScreenLoadActive(): boolean {
  return screenLoadActive;
}
