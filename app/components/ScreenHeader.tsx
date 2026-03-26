import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router";

import { cn } from "~/components/ui/utils";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  /** Title visually centered (back stays tappable on the left), Figma Make style. */
  centerTitle?: boolean;
  /** Right side (e.g. số dư) — với `centerTitle` được đặt absolute phải. */
  endAdornment?: ReactNode;
  className?: string;
  /** Merged into the title `<h1>` (e.g. gold accent on dark headers). */
  titleClassName?: string;
  /** Header on dark surface (e.g. day detail) */
  dark?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  showBack = true,
  centerTitle = false,
  endAdornment,
  className,
  titleClassName,
  dark = false,
}: ScreenHeaderProps) {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => void navigate(-1));

  return (
    <div
      className={cn(
        "pt-5 pb-4",
        centerTitle ? "relative" : "flex items-center gap-3",
        className,
      )}
    >
      {showBack ? (
        <button
          type="button"
          onClick={handleBack}
          aria-label="Quay lại"
          className={cn(
            "shrink-0 flex items-center justify-center transition-opacity active:opacity-60",
            dark ? "text-surface-foreground/60" : "text-muted-foreground",
            centerTitle && "absolute left-0 top-5 z-10",
          )}
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <ChevronLeft size={20} strokeWidth={1.5} />
        </button>
      ) : null}

      <div
        className={cn(
          "min-w-0",
          centerTitle
            ? cn("w-full text-center px-11", endAdornment && "pr-[5.5rem]")
            : "flex-1",
        )}
      >
        <h1
          className={cn(
            "leading-snug truncate",
            dark ? "text-surface-foreground" : "text-foreground",
            titleClassName,
          )}
          style={{
            fontFamily: "var(--font-lora)",
            fontWeight: 700,
            fontSize: "var(--text-xl)",
            lineHeight: 1.3,
          }}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            className={cn(
              "text-xs mt-0.5",
              dark ? "text-surface-foreground/60" : "text-muted-foreground",
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      {endAdornment ? (
        <div
          className={cn(
            "shrink-0",
            centerTitle && "absolute right-0 top-5 z-10",
          )}
        >
          {endAdornment}
        </div>
      ) : null}
    </div>
  );
}
