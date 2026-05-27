import { LogoMark, Mono } from "~/components/brand";
import { useInstallPrompt } from "~/hooks/useInstallPrompt";
import { CT } from "~/lib/c-tokens";

type CInstallBannerProps = {
  onDismiss: () => void;
};

function ShareIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke={CT.ink}
      strokeWidth="1.6"
      aria-hidden
    >
      <path d="M12 3v12 M8 7l4-4 4 4 M5 12v7h14v-7" />
    </svg>
  );
}

function IosInstallSteps() {
  return (
    <div
      className="mt-[18px] border bg-white"
      style={{ borderColor: CT.hairline, padding: "14px 16px" }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: 11,
            color: CT.goldDeep,
            minWidth: 16,
          }}
        >
          1.
        </span>
        <div
          className="flex-1 font-serif text-[13px]"
          style={{ color: CT.ink, lineHeight: 1.5 }}
        >
          Bấm{" "}
          <span
            className="inline-flex align-middle"
            style={{
              padding: "1px 4px",
              border: `1px solid ${CT.muted}`,
              borderRadius: 3,
              margin: "0 2px",
            }}
          >
            <ShareIcon />
          </span>{" "}
          Share ở thanh Safari
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "baseline", marginTop: 8 }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: 11,
            color: CT.goldDeep,
            minWidth: 16,
          }}
        >
          2.
        </span>
        <div
          className="flex-1 font-serif text-[13px]"
          style={{ color: CT.ink, lineHeight: 1.5 }}
        >
          Chọn <strong className="font-semibold">"Thêm vào màn hình chính"</strong>
        </div>
      </div>
      <div
        style={{ display: "flex", gap: 12, alignItems: "baseline", marginTop: 8 }}
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
          3.
        </span>
        <div
          className="flex-1 font-serif text-[13px]"
          style={{ color: CT.ink, lineHeight: 1.5 }}
        >
          Tên app là <strong className="font-semibold">Ngày Lành</strong>, giữ nguyên
          hoặc đổi
        </div>
      </div>
    </div>
  );
}

const sheetStyle = {
  background: CT.paper,
  padding: "14px 24px 28px",
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
} as const;

const primaryBtnStyle = {
  padding: 14,
  background: CT.forest,
  color: CT.cream,
  fontFamily: "var(--font-display-2)",
  fontWeight: 800,
  fontSize: 13,
  letterSpacing: "0.08em",
} as const;

/** Direction C artboard 02 — bottom sheet A2HS (c-screens-d). */
export function CInstallBanner({ onDismiss }: CInstallBannerProps) {
  const { canInstall, showIosInstructions, isStandalone, promptInstall } =
    useInstallPrompt();

  if (isStandalone) return null;
  if (!showIosInstructions && !canInstall) return null;

  async function handleChromiumInstall() {
    const ok = await promptInstall();
    if (ok) onDismiss();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: "rgba(24,21,14,0.5)" }}
      role="dialog"
      aria-label="Cài lên màn hình"
    >
      <div style={sheetStyle}>
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

        <div className="flex items-center gap-[14px]">
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
          className="mt-[18px] font-serif"
          style={{ color: CT.ink2, fontSize: 14, lineHeight: 1.55 }}
        >
          Thêm Ngày Lành vào màn hình chính — mở 1 chạm, không cần qua App Store.
          {showIosInstructions ? " Vẫn xem được lịch khi không có mạng." : null}
        </p>

        {showIosInstructions ? <IosInstallSteps /> : null}

        {canInstall && !showIosInstructions ? (
          <button
            type="button"
            className="mt-[20px] min-h-[44px] w-full cursor-pointer border-none uppercase tracking-[0.08em]"
            style={primaryBtnStyle}
            onClick={() => void handleChromiumInstall()}
          >
            Cài lên màn hình
          </button>
        ) : (
          <button
            type="button"
            className="mt-[20px] min-h-[44px] w-full cursor-pointer border-none uppercase tracking-[0.08em]"
            style={primaryBtnStyle}
            onClick={onDismiss}
          >
            Đã hiểu
          </button>
        )}

        <button
          type="button"
          className="mt-[10px] w-full border-none bg-transparent text-center font-serif text-[12px]"
          style={{ color: CT.muted, cursor: "pointer" }}
          onClick={onDismiss}
        >
          Nhắc tôi lần sau
        </button>
      </div>
    </div>
  );
}
