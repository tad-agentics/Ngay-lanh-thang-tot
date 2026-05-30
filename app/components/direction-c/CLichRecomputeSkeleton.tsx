import { Skeleton } from "~/components/ui/skeleton";
import { CT } from "~/lib/c-tokens";

type Variant = "page" | "month";

/** G1 — lịch-tờ shaped placeholder while lá số recompute runs. */
export function CLichRecomputeSkeleton({ variant = "page" }: { variant?: Variant }) {
  if (variant === "month") {
    return (
      <div className="mt-6" aria-hidden="true">
        <div className="mb-3 grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={`h-${i}`} className="mx-auto h-3 w-6 rounded-none" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-3 gap-x-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="mx-auto h-8 w-8 rounded-full" />
          ))}
        </div>
        <p
          className="mt-8 text-center font-serif text-sm"
          style={{ color: CT.muted }}
        >
          Đang chấm lại lá số…
        </p>
      </div>
    );
  }

  return (
    <div
      className="mt-2 overflow-hidden"
      style={{
        background: "#fff",
        border: `1px solid ${CT.hairline2}`,
        boxShadow: "0 6px 16px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.03)",
      }}
      aria-hidden="true"
    >
      <div className="space-y-3 px-[18px] py-4">
        <Skeleton className="h-3 w-24 rounded-none" />
        <Skeleton className="h-16 w-20 rounded-none" />
        <Skeleton className="h-3 w-40 rounded-none" />
        <Skeleton className="h-4 w-32 rounded-none" />
        <div className="space-y-2 pt-2">
          <Skeleton className="h-3 w-full rounded-none" />
          <Skeleton className="h-3 w-5/6 rounded-none" />
          <Skeleton className="h-3 w-4/6 rounded-none" />
        </div>
      </div>
      <p
        className="border-t px-[18px] py-4 text-center font-serif text-sm"
        style={{ borderColor: CT.hairline, color: CT.muted }}
      >
        Đang chấm lại lá số…
      </p>
    </div>
  );
}
