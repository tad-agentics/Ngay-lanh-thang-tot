import { ChevronDown } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";

const WEIGHTS = [
  ["Hoàng-đạo", "40%"],
  ["Trực", "20%"],
  ["Sao tốt / xấu", "25%"],
  ["Tương sinh với bản mệnh", "15%"],
] as const;

export function DayScoreMethodologyCollapsible() {
  return (
    <Collapsible
      className="mt-4"
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
          Cách tính điểm
        </Mono>
        <ChevronDown className="size-4 shrink-0" style={{ color: CT.muted }} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3.5 pb-3.5">
        <p
          className="m-0 font-serif text-[13px] leading-relaxed"
          style={{ color: CT.ink2 }}
        >
          Điểm số từ 0–100 được tổng hợp từ bốn yếu tố cốt lõi và luận giải riêng biệt dựa trên lá số Bát Tự (Tứ Trụ) của bạn, mang lại kết quả chuẩn xác hơn so với lịch vạn niên thông thường.
        </p>
        <ul className="mt-3 space-y-2 p-0 list-none">
          {WEIGHTS.map(([label, pct]) => (
            <li
              key={label}
              className="flex items-baseline justify-between gap-3 font-serif text-[12.5px]"
              style={{ color: CT.ink }}
            >
              <span>{label}</span>
              <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>{pct}</Mono>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
