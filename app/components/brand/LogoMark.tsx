/** LogoMark — just the circle. Use in app chrome, BottomNav, share watermarks. */

export function LogoMark({
  dark = false,
  size = 28.5,
  className,
}: {
  dark?: boolean;
  size?: number;
  className?: string;
}) {
  const src = dark ? "/logo-mark-reversed.svg" : "/logo-mark.svg";
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt="Ngày Lành Tháng Tốt"
      className={className}
      decoding="async"
      style={{ display: "block" }}
    />
  );
}
