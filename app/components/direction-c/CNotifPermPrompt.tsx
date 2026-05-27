import { CT } from "~/lib/c-tokens";

const DISMISSED_KEY = "ngaytot:notif-perm-dismissed";

export function wasNotifPermDismissed(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(DISMISSED_KEY) === "1";
}

export function dismissNotifPermPrompt(): void {
  window.localStorage.setItem(DISMISSED_KEY, "1");
}

type CNotifPermPromptProps = {
  open: boolean;
  onEnable: () => void;
  onDismiss: () => void;
};

/** Direction C — pre-prompt before browser Notification permission. */
export function CNotifPermPrompt({
  open,
  onEnable,
  onDismiss,
}: CNotifPermPromptProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[55] flex flex-col justify-end"
      style={{ background: "rgba(24,21,14,0.5)" }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="rounded-t-2xl px-[26px] pb-7 pt-3.5"
        style={{ background: CT.paper, fontFamily: "var(--serif)" }}
      >
        <div className="mb-4 flex justify-center">
          <span
            className="h-1 w-9 rounded-sm"
            style={{ background: "rgba(24,21,14,0.18)" }}
          />
        </div>

        <div className="flex justify-center">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
            <circle
              cx="32"
              cy="32"
              r="30"
              stroke={CT.goldDeep}
              strokeWidth="1.4"
              fill="rgba(154,124,34,0.06)"
            />
            <path
              d="M22 36 V28 C22 22, 26 18, 32 18 C38 18, 42 22, 42 28 V36 L44 40 H20 Z"
              stroke={CT.goldDeep}
              strokeWidth="1.6"
              fill="none"
              strokeLinejoin="round"
            />
            <path
              d="M28 42 C28 44, 30 46, 32 46 C34 46, 36 44, 36 42"
              stroke={CT.goldDeep}
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h2
          className="mt-4 text-center font-[family-name:var(--font-display)] text-[28px] font-extrabold uppercase leading-[1.05] tracking-[-0.015em]"
          style={{ color: CT.ink }}
        >
          Nhắc giờ vàng
          <br />
          <span
            className="font-serif text-[28px] font-bold normal-case not-italic tracking-normal"
            style={{ color: CT.goldDeep }}
          >
            cho mỗi việc bạn lưu
          </span>
        </h2>
        <p
          className="mx-auto mt-3 max-w-[300px] text-center text-[13.5px] leading-snug"
          style={{ color: CT.ink2 }}
        >
          Khi bạn lưu một ngày vào sổ, chúng tôi sẽ nhắc{" "}
          <strong className="font-semibold" style={{ color: CT.ink }}>
            1 ngày trước
          </strong>
          , vào{" "}
          <strong className="font-semibold" style={{ color: CT.ink }}>
            8 giờ sáng
          </strong>
          . Không spam, có thể tắt bất cứ lúc nào.
        </p>

        <button
          type="button"
          onClick={onEnable}
          className="mt-6 w-full cursor-pointer border-none py-3.5 font-[family-name:var(--font-display-2)] text-[13px] font-extrabold uppercase tracking-[0.08em]"
          style={{ background: CT.forest, color: CT.cream }}
        >
          Bật thông báo
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-2.5 w-full cursor-pointer border-none bg-transparent py-2 font-serif text-[12.5px]"
          style={{ color: CT.muted }}
        >
          Để sau · không cảm ơn
        </button>
      </div>
    </div>
  );
}
