import { useEffect, useState } from "react";
import { motion } from "motion/react";

type Variant = "on-surface" | "on-card";

interface AiReadingBlockProps {
  /** Tiêu đề khối (tránh trùng nhãn chung từ API hợp tuổi v2). */
  title?: string;
  loading: boolean;
  /** Khi !loading: nếu null hoặc rỗng thì không render. */
  text: string | null;
  variant?: Variant;
  /** Sau khi đã từng loading, nếu không có text — hiển thị gợi ý thay vì ẩn hẳn. */
  emptyLabel?: string;
}

export function AiReadingBlock({
  title = "Luận giải",
  loading,
  text,
  variant = "on-card",
  emptyLabel = "Luận giải tự động tạm chưa tải được. Thử làm mới trang hoặc quay lại sau.",
}: AiReadingBlockProps) {
  const [hasStarted, setHasStarted] = useState(false);
  useEffect(() => {
    if (loading) setHasStarted(true);
  }, [loading]);

  const trimmed = text?.trim() ?? "";
  if (!loading && trimmed.length === 0 && !hasStarted) return null;

  const isSurface = variant === "on-surface";
  const titleCls = isSurface
    ? "text-surface-foreground/55"
    : "text-muted-foreground";
  const shimmerCls = isSurface
    ? "bg-surface-foreground/12"
    : "bg-muted-foreground/18";
  const bodyCls = isSurface
    ? "text-surface-foreground/92"
    : "text-foreground/90";

  return (
    <div
      className={
        isSurface
          ? "mt-3 pt-3 border-t border-surface-foreground/12"
          : "mt-2 rounded-lg border border-border/70 bg-muted/25 px-3 py-2.5"
      }
    >
      <p
        className={`text-[10px] uppercase tracking-wide mb-1.5 ${titleCls}`}
        style={{ fontFamily: "var(--font-ibm-mono)" }}
      >
        {title}
      </p>
      {loading ? (
        <div className="space-y-2" aria-busy="true" aria-live="polite">
          <div className={`h-3 rounded ${shimmerCls} animate-pulse w-full`} />
          <div className={`h-3 rounded ${shimmerCls} animate-pulse w-[92%]`} />
          <div className={`h-3 rounded ${shimmerCls} animate-pulse w-4/5`} />
        </div>
      ) : trimmed.length > 0 ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
          className={`text-sm leading-relaxed ${bodyCls}`}
        >
          {trimmed}
        </motion.p>
      ) : (
        <p
          className={`text-sm leading-relaxed opacity-80 ${isSurface ? "text-surface-foreground/80" : "text-muted-foreground"}`}
        >
          {emptyLabel}
        </p>
      )}
    </div>
  );
}
