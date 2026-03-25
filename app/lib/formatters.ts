/** Shared display helpers — extend during feature work. */

export function formatVnd(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(n) + "₫";
}
