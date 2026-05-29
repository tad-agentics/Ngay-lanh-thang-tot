import { ChevronDown } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";

import type { ScoreMethodologyView } from "~/lib/score-methodology";

const DEFAULT_STEPS = [
  [
    "1",
    "Đối chiếu Bát Tự",
    "Phân tích can chi của Tứ Trụ từ lá số của bản chủ — xác định Nhật chủ và đại vận cát hung hiện tại.",
  ],
  [
    "2",
    "Kiểm Trực · Hoàng Đạo",
    "Khảo sát 12 trực, 28 nhị thập bát tú, giờ Hoàng đạo và Hắc đạo — loại bỏ các ngày xung kỵ với công việc dự định của bạn.",
  ],
  [
    "3",
    "Tính điểm tương hợp",
    "Tính toán điểm số dựa trên sự tương sinh, tương hợp giữa Nhật chủ (bản mệnh) với can chi của ngày, tính chất công việc và khung giờ cát lành.",
  ],
  [
    "4",
    "Sắp xếp & Gợi ý",
    "Danh sách ngày tốt nhất được sắp xếp theo thứ tự ưu tiên dựa trên mức độ cát lành cao nhất với lá số riêng biệt.",
  ],
] as const;

/** Direction C — methodology on tra cứu kết quả (W6). */
export function TraCuuMethodologyCollapsible({
  methodology,
}: {
  methodology?: ScoreMethodologyView | null;
}) {
  const summary =
    methodology?.summaryVi?.trim() ||
    "Hệ thống chọn ngày lành tháng tốt được cá nhân hóa trọn vẹn theo lá số Bát Tự riêng biệt của bản chủ — mang lại kết quả chuẩn xác hơn so với lịch vạn niên thông thường.";
  const weights =
    methodology && methodology.weights.length > 0
      ? methodology.weights
      : null;
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
          {summary}
        </p>
        {weights ? (
          <ul className="mt-3 space-y-2 p-0 list-none">
            {weights.map((w) => (
              <li
                key={w.factor}
                className="flex items-baseline justify-between gap-3 font-serif text-[12.5px]"
                style={{ color: CT.ink }}
              >
                <span>{w.labelVi}</span>
                <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>
                  {w.maxPoints > 0 ? `${w.maxPoints} đ` : "—"}
                </Mono>
              </li>
            ))}
          </ul>
        ) : (
        <div className="mt-3 space-y-2.5">
          {DEFAULT_STEPS.map(([n, title, body]) => (
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
        )}
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
