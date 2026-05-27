import { Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";

type CPickLoadingScreenProps = {
  intentLabel?: string | null;
};

/** Direction C — tra cứu loading (artboard CPickLoading). */
export function CPickLoadingScreen({ intentLabel }: CPickLoadingScreenProps) {
  const accent = intentLabel?.split("·").pop()?.trim() ?? intentLabel ?? "việc của bạn";

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 py-10 text-center">
        <div className="relative h-[110px] w-[100px]">
          <div
            className="absolute left-1.5 top-1.5 h-[100px] w-[88px]"
            style={{ background: "#e1d8b8", boxShadow: "0 6px 12px rgba(0,0,0,0.06)" }}
          />
          <div
            className="absolute left-[3px] top-[3px] h-[100px] w-[88px]"
            style={{ background: "#e8dec1", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}
          />
          <div
            className="absolute left-0 top-0 flex h-[100px] w-[88px] flex-col bg-white"
            style={{ boxShadow: "0 8px 20px rgba(0,0,0,0.12)" }}
          >
            <div className="pt-1 text-center font-serif text-[9px]" style={{ color: CT.muted }}>
              Đang quét
            </div>
            <div className="flex flex-1 items-center justify-center">
              <span
                className="animate-pulse font-[family-name:var(--font-display-2)] text-[56px] font-extrabold leading-none tracking-[-0.04em] tabular-nums"
                style={{ color: CT.red }}
              >
                ···
              </span>
            </div>
          </div>
        </div>

        <div>
          <Mono className="text-[10px] tracking-[0.22em]" style={{ color: CT.goldDeep }}>
            Đang tìm ngày tốt
          </Mono>
          <p
            className="mt-2.5 font-[family-name:var(--font-display)] text-[22px] font-extrabold uppercase leading-[1.1] tracking-[-0.01em]"
            style={{ color: CT.ink }}
          >
            {accent}
          </p>
          <p
            className="mx-auto mt-2 max-w-[280px] text-[13.5px] leading-snug"
            style={{ color: CT.muted }}
          >
            Đối chiếu khoảng ngày với lá số tứ trụ của bạn — vài giây nữa thôi.
          </p>
        </div>

        <div
          className="relative h-[1.5px] w-[200px] overflow-hidden"
          style={{ background: "rgba(154,124,34,0.18)" }}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-[70%] animate-pulse"
            style={{ background: CT.goldDeep }}
          />
        </div>
      </div>
    </div>
  );
}
