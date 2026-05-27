/** Score color for landing marketing visuals (matches c-landing.jsx). */
export function scoreColorFromPoints(s: number): string {
  if (s >= 85) return "#7a9a80";
  if (s >= 70) return "#9a7c22";
  if (s >= 55) return "#bfae7a";
  if (s >= 40) return "#7a7050";
  return "#a3201f";
}
