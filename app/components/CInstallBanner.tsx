import { LogoMark, Mono } from "~/components/brand";
import { useInstallPrompt } from "~/hooks/useInstallPrompt";
import { CT } from "~/lib/c-tokens";

type CInstallBannerProps = {
  onDismiss: () => void;
};

/** Direction C artboard 02 — bottom sheet A2HS (c-screens-d). */
export function CInstallBanner({ onDismiss }: CInstallBannerProps) {
  const { canInstall } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: "rgba(24,21,14,0.5)" }}
      role="dialog"
      aria-label="Cài lên màn hình"
    >
      <div
        style={{
          background: CT.paper,
          padding: "14px 24px 28px",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
      >
        <div className="mb-[18px] flex justify-center">
          <span
            style={{
              width: 36,
              height: 4,
              background: "rgba(24,21,14,0.18)",
              borderRadius: 2,
            }}
          />
        </div>

        <div className="flex items-center gap-3.5">
          <LogoMark size={48} />
          <div style={{ lineHeight: 1.25 }}>
            <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>Cài lên màn hình</Mono>
            <div
              style={{
                marginTop: 2,
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 22,
                color: CT.ink,
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
              }}
            >
              Mở lịch nhanh hơn
            </div>
          </div>
        </div>

        <p
          className="mt-[18px] font-serif text-sm leading-relaxed"
          style={{ color: CT.ink2 }}
        >
          Thêm Ngày Lành vào màn hình chính — mở 1 chạm, không cần qua App Store.
          Vẫn xem được lịch khi không có mạng.
        </p>

        <div
          className="mt-[18px] border bg-white p-4"
          style={{ borderColor: CT.hairline }}
        >
          {[
            "Bấm Share ở thanh Safari",
            'Chọn "Thêm vào màn hình chính"',
            "Tên app là Ngày Lành, giữ nguyên hoặc đổi",
          ].map((text, i) => (
            <div
              key={text}
              className={i > 0 ? "mt-2" : ""}
              style={{ display: "flex", gap: 12, alignItems: "baseline" }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: 11,
                  color: CT.goldDeep,
                  minWidth: 16,
                }}
              >
                {i + 1}.
              </span>
              <span
                className="flex-1 font-serif text-[13px] leading-snug"
                style={{ color: CT.ink }}
              >
                {text}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="mt-5 min-h-[44px] w-full border-none uppercase tracking-widest"
          style={{
            padding: 14,
            background: CT.forest,
            color: CT.cream,
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: "0.08em",
          }}
          onClick={onDismiss}
        >
          Đã hiểu
        </button>
        <button
          type="button"
          className="mt-2.5 w-full border-none bg-transparent font-serif text-xs"
          style={{ color: CT.muted, cursor: "pointer" }}
          onClick={onDismiss}
        >
          Nhắc tôi lần sau
        </button>
      </div>
    </div>
  );
}
