import { Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";

export function VanTrinhNamMonthNav({ year }: { year: number }) {
  return (
    <nav
      className="sticky top-0 z-10 -mx-6 mb-4 flex gap-1 overflow-x-auto border-b px-6 py-2 backdrop-blur-sm"
      style={{
        background: "rgba(250,248,243,0.92)",
        borderColor: CT.hairline2,
      }}
      aria-label={`Đi tới tháng — vận trình năm ${year}`}
    >
      {Array.from({ length: 12 }, (_, i) => {
        const n = i + 1;
        return (
          <a
            key={n}
            href={`#thang-${n}`}
            className="shrink-0 px-2 py-1 no-underline"
          >
            <Mono className="text-[10px]" style={{ color: CT.ink2 }}>
              T{n}
            </Mono>
          </a>
        );
      })}
    </nav>
  );
}
