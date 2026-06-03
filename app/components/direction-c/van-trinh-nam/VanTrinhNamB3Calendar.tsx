import { Link } from "react-router";

import { Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";
import type { VanTrinhNamDayRow, VanTrinhNamMonthBlock } from "~/lib/van-trinh-nam-types";

function DayRow({
  row,
  tone,
}: {
  row: VanTrinhNamDayRow;
  tone: "good" | "avoid";
}) {
  const border =
    tone === "good" ? CT.greenMute : CT.red;
  return (
    <Link
      to={`/ngay/${row.date}`}
      className="mt-2 block border-l-2 py-1 pl-2.5 no-underline"
      style={{ borderColor: border }}
    >
      <p className="font-serif text-[12.5px] leading-snug" style={{ color: CT.ink }}>
        {row.date_vi}
      </p>
      <p className="font-serif text-[11.5px]" style={{ color: CT.muted }}>
        {row.can_chi} · {row.grade} · {row.score} điểm
      </p>
    </Link>
  );
}

export function VanTrinhNamB3Calendar({
  month,
  year,
}: {
  month: VanTrinhNamMonthBlock;
  year: number;
}) {
  const b3 = month.b3_luu_nhat_calendar;
  const [y, m] = month.target_month.split("-").map(Number);
  const lichThangTo =
    y && m ? `/lich/thang?year=${y}&month=${m}` : `/lich/thang?year=${year}`;

  return (
    <div className="mt-3 border-t pt-3" style={{ borderColor: CT.hairline2 }}>
      <Mono className="text-[9px]" style={{ color: CT.goldDeep }}>
        Lưu nhật · lịch ngày trong tháng
      </Mono>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <div>
          <Mono className="text-[9px]" style={{ color: CT.greenMute }}>
            Nên chọn
          </Mono>
          {b3.best_days.map((d) => (
            <DayRow key={d.date} row={d} tone="good" />
          ))}
        </div>
        <div>
          <Mono className="text-[9px]" style={{ color: CT.red }}>
            Nên tránh
          </Mono>
          {b3.avoid_days.map((d) => (
            <DayRow key={d.date} row={d} tone="avoid" />
          ))}
        </div>
      </div>
      {b3.top_hours.length > 0 ? (
        <p className="mt-2 font-serif text-[11.5px] leading-relaxed" style={{ color: CT.ink2 }}>
          Giờ vàng gợi ý: {b3.top_hours.join(" · ")}
        </p>
      ) : null}
      <Link
        to={lichThangTo}
        className="mt-2 inline-block font-mono text-[10px] uppercase tracking-widest underline"
        style={{ color: CT.goldDeep }}
      >
        Xem full lịch tháng {month.month_num}
      </Link>
    </div>
  );
}
