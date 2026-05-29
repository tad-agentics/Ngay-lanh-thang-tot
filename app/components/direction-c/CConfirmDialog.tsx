import type { ReactNode } from "react";

import { Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";

type CConfirmDialogProps = {
  open: boolean;
  title: ReactNode;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Direction C — centered confirm modal (logout, destructive actions). */
export function CConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Huỷ",
  onConfirm,
  onCancel,
}: CConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-7"
      style={{ background: "rgba(24,21,14,0.55)" }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-[320px] px-[22px] py-5"
        style={{ background: CT.paper, fontFamily: "var(--serif)" }}
      >
        <Mono style={{ color: CT.muted, fontSize: 9 }}>Xác nhận</Mono>
        <h3
          className="mt-1.5 font-[family-name:var(--display)] text-[22px] font-extrabold uppercase leading-[1.1] tracking-[-0.01em]"
          style={{ color: CT.ink }}
        >
          {title}
        </h3>
        <p className="mt-2.5 text-[13.5px] leading-snug" style={{ color: CT.ink2 }}>
          {description}
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 cursor-pointer border py-3 font-[family-name:var(--display-2)] text-xs font-bold uppercase tracking-[0.06em]"
            style={{ borderColor: CT.hairline, background: "transparent", color: CT.ink }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 cursor-pointer border-none py-3 font-[family-name:var(--display-2)] text-xs font-extrabold uppercase tracking-[0.06em]"
            style={{ background: CT.ink, color: CT.paper }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
