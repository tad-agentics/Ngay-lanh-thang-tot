import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { cn } from "~/components/ui/utils";

const METHODOLOGY_HASH = "phuong-phap-chon-ngay";

export function chonNgayMethodologyHash(): string {
  return METHODOLOGY_HASH;
}

export function ChonNgayMethodologyCollapsible({
  className,
  /** Chỉ nội dung — dùng nút/link bên ngoài; bắt buộc kèm `open` + `onOpenChange`. */
  hideTrigger = false,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: {
  className?: string;
  hideTrigger?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : internalOpen;

  function setOpen(next: boolean) {
    if (!controlled) {
      setInternalOpen(next);
    }
    onOpenChangeProp?.(next);
  }

  useEffect(() => {
    if (hideTrigger || controlled) return;
    const sync = () => {
      const h =
        typeof window !== "undefined"
          ? window.location.hash.replace(/^#/, "")
          : "";
      if (h === METHODOLOGY_HASH) setInternalOpen(true);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [hideTrigger, controlled]);

  return (
    <div id={METHODOLOGY_HASH} className={cn("scroll-mt-4", className)}>
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className={cn(
          "rounded-[var(--radius-lg)]",
          !hideTrigger || open
            ? "border border-border bg-card shadow-sm"
            : "",
        )}
      >
        {!hideTrigger ? (
          <CollapsibleTrigger
            className="flex w-full items-center justify-between gap-2 px-3.5 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/40 rounded-[var(--radius-lg)] transition-colors [&[data-state=open]>svg]:rotate-180"
            aria-controls={`${METHODOLOGY_HASH}-panel`}
            id={`${METHODOLOGY_HASH}-trigger`}
          >
            <span className="min-w-0 pr-2">
              Ngày lành tháng tốt hoạt động như thế nào?
              <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                Cá nhân hoá theo lá số Bát Tự (Tứ Trụ) của bạn - không phải lịch
                vạn niên chung chung
              </span>
            </span>
            <ChevronDown className="size-4 shrink-0 transition-transform duration-200" />
          </CollapsibleTrigger>
        ) : null}
        <CollapsibleContent
          id={`${METHODOLOGY_HASH}-panel`}
          role="region"
          aria-labelledby={
            hideTrigger ? undefined : `${METHODOLOGY_HASH}-trigger`
          }
          aria-label={hideTrigger ? "Phương pháp chọn ngày" : undefined}
          className={cn(
            "px-3.5 pb-3.5 data-[state=closed]:animate-none",
            hideTrigger ? "pt-3.5" : "pt-0",
          )}
        >
          <div className="rounded-[calc(var(--radius-lg)-4px)] border border-border/80 bg-muted/25 px-3 py-3 space-y-3 text-sm text-muted-foreground leading-relaxed">
            <h2 className="text-foreground text-sm font-semibold font-[family-name:var(--font-lora)]">
              Cách chúng tôi chọn ngày cho bạn — 4 bước
            </h2>
            <div className="space-y-3">
              {(
                [
                  ["1", "Đối chiếu Bát Tự", "Lấy can chi 4 trụ (năm/tháng/ngày/giờ) từ lá số của bạn — xác định ngũ hành nhật chủ và đại vận hiện tại."],
                  ["2", "Kiểm Trực · Hoàng Đạo", "12 trực + 28 sao + Hoàng/Hắc đạo. Loại sớm những ngày kỵ với việc bạn chọn."],
                  ["3", "Tính điểm phù hợp", "Mỗi ngày được chấm theo công thức: tương sinh nhật chủ × hợp việc × giờ tốt sẵn có. Điểm 0–100."],
                  ["4", "Sắp xếp & gợi ý", "Top ngày được luận giải dựa trên lá số riêng — không phải bản dịch chung."],
                ] as [string, string, string][]
              ).map(([n, h, d]) => (
                <div key={n} className="flex gap-2.5">
                  <div className="shrink-0 w-6 h-6 bg-[var(--gold,#c5a55a)] text-[var(--paper,#f0ece2)] flex items-center justify-center font-[family-name:var(--font-barlow-condensed)] font-bold text-xs">
                    {n}
                  </div>
                  <div>
                    <span className="text-foreground font-medium">{h}</span>
                    {" — "}
                    {d}
                  </div>
                </div>
              ))}
            </div>
            <p className="pt-2 border-t border-border/60 text-foreground/70 text-xs italic">
              Dữ liệu: Hiệp Kỷ Biện Phương Thư · Ngọc Hạp Thông Thư · phương pháp Trạch Cát truyền thống.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
