import { Mono } from "~/components/brand";
import type { BaziLoadProgress } from "~/lib/bazi-reading-progress";
import { CT } from "~/lib/c-tokens";

type CBaziReadingLoadProgressProps = {
  progress: BaziLoadProgress;
};

/** Thanh tiến độ + nhãn § đang luận (staged generate). */
export function CBaziReadingLoadProgress({
  progress,
}: CBaziReadingLoadProgressProps) {
  const pct =
    progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 0;

  return (
    <div
      className="mt-5 rounded-sm border px-3.5 py-3"
      style={{
        borderColor: CT.hairline2,
        background: "rgba(122,154,128,0.08)",
      }}
      aria-live="polite"
      role="status"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-serif text-[12.5px] leading-snug" style={{ color: CT.ink2 }}>
          {progress.activeLabel}
        </p>
        <Mono className="shrink-0 text-[9.5px] tabular-nums" style={{ color: CT.muted }}>
          {progress.done}/{progress.total}
        </Mono>
      </div>
      <div
        className="mt-2.5 h-1 overflow-hidden rounded-full"
        style={{ background: CT.hairline2 }}
      >
        <div
          className="h-full transition-[width] duration-500 ease-out"
          style={{
            width: `${Math.max(8, pct)}%`,
            background: CT.greenMute,
          }}
        />
      </div>
      <p className="mt-2 font-serif text-[11px] italic leading-snug" style={{ color: CT.muted }}>
        Luận chi tiết mất khoảng 1–2 phút — bạn đọc dần từng phần bên trên khi sẵn sàng.
      </p>
    </div>
  );
}
