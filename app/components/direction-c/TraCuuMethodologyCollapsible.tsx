import { ChevronDown } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";

const STEPS = [
  [
    "1",
    "Đối chiếu Bát Tự",
    "Lấy can chi bốn trụ từ lá số — xác định nhật chủ và đại vận hiện tại.",
  ],
  [
    "2",
    "Kiểm Trực · Hoàng Đạo",
    "12 trực, 28 sao, Hoàng/Hắc đạo — loại sớm ngày kỵ với việc bạn chọn.",
  ],
  [
    "3",
    "Tính điểm phù hợp",
    "Chấm 0–100 theo tương sinh nhật chủ, hợp việc và giờ tốt có sẵn.",
  ],
  [
    "4",
    "Sắp xếp & gợi ý",
    "Top ngày được xếp hạng theo lá số riêng — không phải lịch chung.",
  ],
] as const;

/** Direction C — methodology on tra cứu kết quả (W6). */
export function TraCuuMethodologyCollapsible() {
  return (
    <Collapsible
      className="mt-6"
      style={{
        border: `1px solid ${CT.hairline2}`,
        background: "rgba(154,124,34,0.04)",
      }}
    >
      <CollapsibleTrigger
        className="flex w-full items-center justify-between gap-2 px-3.5 py-3 text-left [&[data-state=open]>svg]:rotate-180"
        style={{ background: "transparent", border: "none", cursor: "pointer" }}
      >
        <Mono style={{ color: CT.goldDeep, fontSize: 10, letterSpacing: "0.12em" }}>
          Cách chọn ngày
        </Mono>
        <ChevronDown className="size-4 shrink-0" style={{ color: CT.muted }} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3.5 pb-3.5">
        <p
          className="m-0 font-serif text-[13px] leading-relaxed"
          style={{ color: CT.ink2 }}
        >
          Ngày lành tháng tốt cá nhân hoá theo lá số Bát Tự của bạn — không phải lịch
          vạn niên chung.
        </p>
        <div className="mt-3 space-y-2.5">
          {STEPS.map(([n, title, body]) => (
            <div key={n} className="flex gap-2.5">
              <span
                className="shrink-0 font-mono text-[10px] font-bold tabular-nums"
                style={{ color: CT.goldDeep, marginTop: 2 }}
              >
                {n}
              </span>
              <p className="m-0 font-serif text-[12.5px] leading-snug" style={{ color: CT.ink }}>
                <strong>{title}</strong>
                {" — "}
                <span style={{ color: CT.ink2 }}>{body}</span>
              </p>
            </div>
          ))}
        </div>
        <p
          className="mt-3 pt-2 font-serif text-[11px] italic leading-snug"
          style={{ color: CT.muted, borderTop: `1px solid ${CT.hairline2}` }}
        >
          Nguồn: Hiệp Kỷ Biện Phương · Ngọc Hạp Thông Thư · Trạch Cát truyền thống.
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}
