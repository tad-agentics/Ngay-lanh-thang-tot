import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router";

import { cn } from "~/components/ui/utils";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  className?: string;
  /** Header on dark surface (e.g. day detail) */
  dark?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  showBack = true,
  className,
  dark = false,
}: ScreenHeaderProps) {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => void navigate(-1));

  return (
    <div className={cn("flex items-center gap-3 pt-5 pb-4", className)}>
      {showBack ? (
        <button
          type="button"
          onClick={handleBack}
          aria-label="Quay lại"
          className={cn(
            "shrink-0 flex items-center justify-center transition-opacity active:opacity-60",
            dark ? "text-surface-foreground/60" : "text-muted-foreground",
          )}
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <ChevronLeft size={20} strokeWidth={1.5} />
        </button>
      ) : null}

      <div className="flex-1 min-w-0">
        <h1
          className={cn(
            "leading-snug truncate",
            dark ? "text-surface-foreground" : "text-foreground",
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
    </div>
  );
}
