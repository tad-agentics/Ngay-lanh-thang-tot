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
}: {
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      const h =
        typeof window !== "undefined"
          ? window.location.hash.replace(/^#/, "")
          : "";
      if (h === METHODOLOGY_HASH) setOpen(true);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  return (
    <div id={METHODOLOGY_HASH} className={cn("scroll-mt-4", className)}>
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className="rounded-[var(--radius-lg)] border border-border bg-card shadow-sm"
      >
        <CollapsibleTrigger
          className="flex w-full items-center justify-between gap-2 px-3.5 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/40 rounded-[var(--radius-lg)] transition-colors [&[data-state=open]>svg]:rotate-180"
          aria-controls={`${METHODOLOGY_HASH}-panel`}
          id={`${METHODOLOGY_HASH}-trigger`}
        >
          <span className="min-w-0 pr-2">
            Chọn ngày hoạt động thế nào?
            <span className="block text-xs font-normal text-muted-foreground mt-0.5">
              Cá nhân hóa theo Bát Tự — không phải lịch chung
            </span>
          </span>
          <ChevronDown className="size-4 shrink-0 transition-transform duration-200" />
        </CollapsibleTrigger>
        <CollapsibleContent
          id={`${METHODOLOGY_HASH}-panel`}
          role="region"
          aria-labelledby={`${METHODOLOGY_HASH}-trigger`}
          className="px-3.5 pb-3.5 pt-0 data-[state=closed]:animate-none"
        >
          <div className="rounded-[calc(var(--radius-lg)-4px)] border border-border/80 bg-muted/25 px-3 py-3 space-y-3 text-sm text-muted-foreground leading-relaxed">
            <h2 className="text-foreground text-sm font-semibold font-[family-name:var(--font-lora)]">
              Chọn Ngày Tốt — Cá Nhân Hóa Theo Bát Tự
            </h2>
            <p>Không phải ngày tốt của người này là ngày tốt của người kia.</p>
            <p className="font-medium text-foreground/90">
              Hệ thống chọn ngày của chúng tôi hoạt động qua 3 bước:
            </p>
            <ol className="list-decimal pl-4 space-y-2.5 marker:text-foreground marker:font-medium">
              <li>
                <span className="text-foreground font-medium">
                  Bước 1: Loại ngày xấu
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
                So ngày với mệnh, Dụng Thần, Kỵ Thần riêng của bạn. Ngày tốt
                với người mệnh Kim có thể là ngày xấu với người mệnh Mộc.
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
              chọn không chỉ &quot;không xấu&quot; — mà thực sự hợp mệnh với
              riêng bạn.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
