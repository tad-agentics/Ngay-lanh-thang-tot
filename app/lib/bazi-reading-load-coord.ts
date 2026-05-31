/** Tránh prewarm nền chồng loader màn `/toi/luan-bat-tu`. */

let screenLoadActive = false;

export function setBaziReadingScreenLoadActive(active: boolean): void {
  screenLoadActive = active;
}

export function isBaziReadingScreenLoadActive(): boolean {
  return screenLoadActive;
}
