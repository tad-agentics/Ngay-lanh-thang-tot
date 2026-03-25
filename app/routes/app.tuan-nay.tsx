import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ChevronRight } from "lucide-react";

import { Chip } from "~/components/Chip";
import { ErrorBanner } from "~/components/ErrorBanner";
import { ScreenHeader } from "~/components/ScreenHeader";
import { Button } from "~/components/ui/button";
import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import {
  parseWeeklySummaryForScreen,
  type WeeklySummaryScreen,
} from "~/lib/home-bat-tu";
import { useProfile } from "~/hooks/useProfile";

function gradeChipColor(grade: string): "success" | "warning" | "danger" | "default" {
  const g = grade.toUpperCase();
  if (g === "A") return "success";
  if (g === "B") return "warning";
  if (g === "C" || g === "D" || g === "E" || g === "F") return "danger";
  return "default";
}

export default function AppTuanNay() {
  const { profile, loading: profileLoading } = useProfile();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [weekly, setWeekly] = useState<WeeklySummaryScreen | null>(null);

  useEffect(() => {
    if (profileLoading) return;

    const q = profileToBatTuPersonQuery(profile);
    if (!q.birth_date) {
      setLoading(false);
      setErr(null);
      setWeekly(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async () => {
      const res = await invokeBatTu({
        op: "weekly-summary",
        body: { ...q, intent: "MAC_DINH" },
      });
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        setErr(res.message);
        setWeekly(null);
        return;
      }
      setErr(null);
      setWeekly(parseWeeklySummaryForScreen(res.data));
    })();
    return () => {
      cancelled = true;
    };
  }, [profileLoading, profile]);

  const showWeekly = !profileLoading && profile && profile.ngay_sinh;

  return (
    <div className="px-4 pb-8 space-y-6">
      <ScreenHeader title="Tuần này" />

      <p className="text-sm text-muted-foreground">
        Các ngày nổi bật trong tuần theo lá số của bạn. Chạm một ngày để xem chi tiết
        đầy đủ.{" "}
        <a
          href="https://tu-tru-api.fly.dev/docs"
          className="underline underline-offset-4"
          target="_blank"
          rel="noreferrer"
        >
          Tài liệu API
        </a>
      </p>

      {!profileLoading && profile && !profile.ngay_sinh ? (
        <div className="rounded-xl border border-border bg-card p-4 text-sm space-y-3">
          <p className="text-muted-foreground">
            Thêm ngày sinh trong Cài đặt để xem gợi ý tuần này.
          </p>
          <Button asChild variant="secondary" className="w-full sm:w-auto">
            <Link to="/app/cai-dat">Mở Cài đặt</Link>
          </Button>
        </div>
      ) : null}

      {loading || profileLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl border border-border bg-card animate-pulse"
            />
          ))}
        </div>
      ) : err ? (
        <ErrorBanner message={err} />
      ) : showWeekly && weekly ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 text-sm">
            <p
              className="text-muted-foreground text-xs uppercase tracking-wider mb-1"
              style={{ fontFamily: "var(--font-ibm-mono)" }}
            >
              Phạm vi tuần
            </p>
            <p
              className="text-foreground font-medium"
              style={{ fontFamily: "var(--font-lora)" }}
            >
              {weekly.weekRangeLabel}
            </p>
            {weekly.summaryCount != null ? (
              <p className="text-muted-foreground text-xs mt-2">
                Gợi ý: {weekly.summaryCount} ngày trong danh sách ưu tiên
                {weekly.intent && weekly.intent !== "—"
                  ? ` · Mục đích: ${weekly.intent}`
                  : ""}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            {weekly.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Chưa có danh sách ngày gợi ý cho tuần này.
              </p>
            ) : (
              weekly.rows.map((row) => (
                <Link
                  key={row.isoDate}
                  to={`/app/ngay/${row.isoDate}`}
                  className="block rounded-xl border border-border bg-card p-4 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-xs text-muted-foreground mb-0.5"
                        style={{ fontFamily: "var(--font-ibm-mono)" }}
                      >
                        {row.dateLabelVi}
                      </p>
                      <p className="text-sm text-foreground line-clamp-3 leading-snug">
                        {row.oneLiner}
                      </p>
                      {row.bestHours !== "—" ? (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          Giờ tốt: {row.bestHours}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Chip
                        color={gradeChipColor(row.grade)}
                        variant="flat"
                        size="sm"
                        radius="sm"
                      >
                        {row.grade}
                      </Chip>
                      {row.score != null ? (
                        <span
                          className="text-xs text-muted-foreground"
                          style={{ fontFamily: "var(--font-ibm-mono)" }}
                        >
                          {row.score}
                        </span>
                      ) : null}
                      <ChevronRight
                        size={18}
                        className="text-muted-foreground mt-1"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      ) : showWeekly && !weekly ? (
        <p className="text-sm text-muted-foreground">
          Chưa đọc được tuần này. Thử lại sau vài giây.
        </p>
      ) : null}
    </div>
  );
}
