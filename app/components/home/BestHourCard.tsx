import { Clock } from "lucide-react";

import { GrainOverlay } from "~/components/GrainOverlay";

interface BestHourCardProps {
  hourRange: string;
  isLoading?: boolean;
}

export function BestHourCard({ hourRange, isLoading }: BestHourCardProps) {
  if (isLoading) {
    return (
      <div
        className="relative overflow-hidden px-4 py-3 bg-surface"
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        <GrainOverlay />
        <div className="relative">
          <div className="h-3 w-20 bg-surface-foreground/10 rounded mb-2 animate-pulse" />
          <div className="h-5 w-40 bg-surface-foreground/10 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden px-4 py-3 bg-surface text-surface-foreground flex items-center gap-3"
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      <GrainOverlay />
      <Clock size={18} className="relative text-accent shrink-0" strokeWidth={1.5} />
      <div className="relative">
        <p className="text-surface-foreground/60 text-xs mb-0.5">Giờ tốt hôm nay</p>
        <p className="text-surface-foreground text-sm font-medium">{hourRange}</p>
      </div>
    </div>
  );
}
