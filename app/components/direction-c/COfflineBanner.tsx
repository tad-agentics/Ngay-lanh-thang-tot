import { CT } from "~/lib/c-tokens";

/** Direction C — offline strip on Tab Lịch (artboard 40). */
export function COfflineBanner() {
  return (
    <div
      className="flex items-center gap-2.5 px-[22px] py-2"
      style={{
        background: "#3a2a14",
        color: "#e8d9a3",
        borderBottom: "1px solid rgba(197,165,90,0.2)",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 12 a7 7 0 0 1 14 0 M8.5 15 a3 3 0 0 1 7 0 M12 18.5 v.1"
          stroke="#e8d9a3"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path d="M3 3 L21 21" stroke="#e8d9a3" strokeWidth="1.6" />
      </svg>
      <p className="m-0 flex-1 font-serif text-[11.5px] leading-snug">
        <strong className="font-semibold">Đang offline.</strong> Trang lịch đã tải vẫn xem được — luận
        giải cần kết nối lại.
      </p>
    </div>
  );
}
