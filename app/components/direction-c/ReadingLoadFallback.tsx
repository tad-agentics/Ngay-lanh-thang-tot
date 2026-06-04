import { CT, DISPLAY2 } from "~/lib/c-tokens";

type ReadingLoadFallbackProps = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
};

/** Màn luận — lỗi tải / chưa có nội dung (tránh màn trống). */
export function ReadingLoadFallback({
  message,
  onRetry,
  retryLabel = "Tải lại",
}: ReadingLoadFallbackProps) {
  return (
    <div className="mt-8 text-center">
      <p className="font-serif text-sm leading-relaxed" style={{ color: CT.muted }}>
        {message}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider"
          style={{ ...DISPLAY2, background: CT.forest, color: CT.cream, border: "none" }}
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
