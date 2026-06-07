import { Skeleton } from "~/components/ui/skeleton";
import { CT } from "~/lib/c-tokens";

/** Phiếu ngày placeholder — giữ chiều cao ~LichToPageCard khi đổi ngày trên /lich. */
export function CLichDayCardSkeleton() {
  return (
    <div
      className="overflow-hidden"
      style={{
        background: "#fff",
        border: `1px solid ${CT.hairline2}`,
        boxShadow: "0 6px 16px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.03)",
      }}
      role="status"
      aria-busy="true"
      aria-label="Đang tải phiếu ngày"
    >
      <div style={{ padding: "12px 18px 6px" }}>
        <Skeleton className="h-3.5 w-[58%] max-w-[220px] rounded-none" />
      </div>

      <div
        className="flex items-end gap-3.5"
        style={{ padding: "4px 18px 12px" }}
      >
        <Skeleton className="h-[104px] w-[88px] shrink-0 rounded-none" />
        <Skeleton className="mb-3.5 h-8 w-24 rounded-none" />
      </div>

      <div style={{ padding: "0 18px 16px" }}>
        <Skeleton className="h-3.5 w-full max-w-[280px] rounded-none" />
        <Skeleton className="mt-2 h-3.5 w-[72%] max-w-[200px] rounded-none" />
      </div>

      <div
        className="flex items-baseline justify-between gap-3"
        style={{
          padding: "14px 18px 4px",
          borderTop: `1px solid ${CT.hairline}`,
        }}
      >
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-36 rounded-none" />
          <Skeleton className="h-3 w-28 rounded-none" />
        </div>
        <Skeleton className="h-10 w-14 shrink-0 rounded-none" />
      </div>

      <div
        className="space-y-2"
        style={{
          padding: "12px 18px",
          borderTop: `1px solid ${CT.hairline}`,
        }}
      >
        <Skeleton className="h-3 w-full rounded-none" />
        <Skeleton className="h-3 w-[92%] rounded-none" />
        <Skeleton className="h-3 w-[78%] rounded-none" />
      </div>

      <div
        className="flex flex-col gap-2"
        style={{
          padding: "12px 18px 14px",
          borderTop: `1px solid ${CT.hairline}`,
        }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-baseline gap-3.5">
            <Skeleton className="h-3 w-12 shrink-0 rounded-none" />
            <Skeleton className="h-3 flex-1 rounded-none" />
          </div>
        ))}
      </div>
    </div>
  );
}
