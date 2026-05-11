/** Standalone mark from brand kit (`public/logo-mark.svg` / `logo-mark-reversed.svg`). */

export function BrandLogoMark({
  variant = "primary",
  className,
  size = 64,
  alt = "",
}: {
  variant?: "primary" | "reversed";
  className?: string;
  size?: number;
  alt?: string;
}) {
  const src =
    variant === "reversed"
      ? "/logo-mark-reversed.svg"
      : "/logo-mark.svg";
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      decoding="async"
    />
  );
}
