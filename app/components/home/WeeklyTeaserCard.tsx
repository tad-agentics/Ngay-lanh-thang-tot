import { useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";

interface WeeklyTeaserCardProps {
  goodDayCount: number | null;
  hasLaso: boolean;
  menh: string | null;
  isLoading?: boolean;
}

export function WeeklyTeaserCard({
  goodDayCount,
  hasLaso,
  menh,
  isLoading,
}: WeeklyTeaserCardProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="px-4 py-3 border border-border bg-card" style={{ borderRadius: "var(--radius-lg)" }}>
        <div className="h-4 w-48 bg-muted rounded mb-1 animate-pulse" />
        <div className="h-3 w-32 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  const message =
    goodDayCount != null
      ? hasLaso && menh
        ? `Tuần này có ${goodDayCount} ngày tốt theo mệnh ${menh} của bạn`
        : `Tuần này có ${goodDayCount} ngày Hoàng Đạo`
      : hasLaso && menh
        ? `Tuần này — xem ngày tốt theo mệnh ${menh}`
        : "Tuần này — xem các ngày Hoàng Đạo và gợi ý";

  const sub = hasLaso
    ? "Mở chọn ngày để lọc theo mục đích"
    : "Thêm lá số để cá nhân hóa theo mệnh";

  return (
    <button
      type="button"
      onClick={() => void navigate("/app/chon-ngay")}
      className="w-full px-4 py-3 border border-border bg-card text-left flex items-center justify-between gap-3 transition-colors active:bg-muted"
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      <div>
        <p className="text-foreground text-sm font-medium">{message}</p>
        <p className="text-muted-foreground text-xs mt-0.5">{sub}</p>
      </div>
      <ArrowRight size={16} className="text-muted-foreground shrink-0" strokeWidth={1.5} />
    </button>
  );
}
