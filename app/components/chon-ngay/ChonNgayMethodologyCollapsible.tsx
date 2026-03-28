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
              Chọn Ngày Lành - Cá Nhân Hoá Theo Bản Mệnh
            </h2>
            <p>Không phải ngày lành của người này là ngày lành của người kia.</p>
            <p className="font-medium text-foreground/90">
              Hệ thống chọn ngày của chúng tôi hoạt động qua 3 bước:
            </p>
            <ol className="list-decimal pl-4 space-y-2.5 marker:text-foreground marker:font-medium">
              <li>
                <span className="text-foreground font-medium">
                  Bước 1: Loại ngày dữ
                </span>
                {" — "}
                Tự động loại các ngày Nguyệt Kỵ, Tam Nương, Dương Công Kỵ mà ai
                cũng nên tránh.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Bước 2: Đối chiếu lá số
                </span>
                {" — "}
                So ngày với mệnh, Dụng Thần, Kỵ Thần riêng của bạn. Ngày lành
                với người mệnh Kim có thể là ngày dữ với người mệnh Mộc.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Bước 3: Xếp hạng thông minh
                </span>
                {" — "}
                Từ hàng chục ngày còn lại, hệ thống chấm điểm dựa trên Trực, sao
                cát hung, ngũ hành tương sinh với mệnh bạn — chọn ra top 3
                ngày đẹp nhất.
              </li>
            </ol>
            <p className="pt-1 border-t border-border/60 text-foreground/95">
              <span className="font-medium">Kết quả:</span> Những ngày được
              chọn không chỉ &quot;không dữ&quot; — mà thực sự hợp mệnh với
              riêng bạn.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
