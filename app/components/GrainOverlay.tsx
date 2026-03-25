/**
 * Film-grain overlay for deep forest hero cards (`bg-surface` / `bg-forest`, cùng token).
 * Place first inside `relative overflow-hidden` so content stacks above.
 */

export const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`;

export function GrainOverlay() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none mix-blend-overlay"
      style={{
        backgroundImage: GRAIN_SVG,
        backgroundSize: "256px 256px",
        opacity: 0.35,
      }}
    />
  );
}
