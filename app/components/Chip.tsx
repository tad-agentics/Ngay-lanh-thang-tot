import { cn } from "~/components/ui/utils";

type ChipColor = "success" | "danger" | "warning" | "default" | "accent";
type ChipVariant = "flat" | "solid" | "bordered";
type ChipSize = "sm" | "md";
type ChipRadius = "sm" | "md" | "pill";

interface ChipProps {
  color?: ChipColor;
  variant?: ChipVariant;
  size?: ChipSize;
  radius?: ChipRadius;
  children: React.ReactNode;
  className?: string;
}

const RADIUS_MAP: Record<ChipRadius, string> = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  pill: "var(--radius-pill)",
};

const COLOR_FLAT: Record<ChipColor, string> = {
  success: "bg-success/15 text-success",
  danger: "bg-danger/15 text-danger",
  warning: "bg-warning/15 text-warning",
  default: "bg-muted text-muted-foreground",
  accent: "bg-accent/20 text-accent-foreground",
};

const COLOR_SOLID: Record<ChipColor, string> = {
  success: "bg-success text-success-foreground",
  danger: "bg-danger text-danger-foreground",
  warning: "bg-warning text-warning-foreground",
  default: "bg-muted text-muted-foreground",
  accent: "bg-accent text-accent-foreground",
};

const COLOR_BORDERED: Record<ChipColor, string> = {
  success: "border border-success text-success bg-transparent",
  danger: "border border-danger text-danger bg-transparent",
  warning: "border border-warning text-warning bg-transparent",
  default: "border border-border text-muted-foreground bg-transparent",
  accent: "border border-accent text-accent bg-transparent",
};

const SIZE_CLASS: Record<ChipSize, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-1 text-xs",
};

export function Chip({
  color = "default",
  variant = "flat",
  size = "sm",
  radius = "sm",
  children,
  className,
}: ChipProps) {
  const colorClass =
    variant === "solid"
      ? COLOR_SOLID[color]
      : variant === "bordered"
        ? COLOR_BORDERED[color]
        : COLOR_FLAT[color];

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium leading-none",
        SIZE_CLASS[size],
        colorClass,
        className,
      )}
      style={{ borderRadius: RADIUS_MAP[radius] }}
    >
      {children}
    </span>
  );
}
