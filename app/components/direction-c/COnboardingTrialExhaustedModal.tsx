import { Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";
import {
  ONBOARDING_TRIAL_EXHAUSTED_BODY,
  ONBOARDING_TRIAL_EXHAUSTED_CTA,
  ONBOARDING_TRIAL_EXHAUSTED_DISMISS,
  ONBOARDING_TRIAL_EXHAUSTED_TITLE,
} from "~/lib/onboarding-trial-exhausted-copy";

type COnboardingTrialExhaustedModalProps = {
  open: boolean;
  onDismiss: () => void;
  onPurchase: () => void;
};

/** Direction C — hết 5 lượt chat onboarding; nền blur. */
export function COnboardingTrialExhaustedModal({
  open,
  onDismiss,
  onPurchase,
}: COnboardingTrialExhaustedModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-7 backdrop-blur-md"
      style={{ background: "rgba(14, 28, 20, 0.48)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-trial-exhausted-title"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-[320px] px-[22px] py-5 shadow-[0_12px_40px_rgba(14,28,20,0.22)]"
        style={{ background: CT.paper, fontFamily: "var(--serif)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <Mono style={{ color: CT.muted, fontSize: 9.5 }}>Lịch cát tường</Mono>
        <h2
          id="onboarding-trial-exhausted-title"
          className="mt-1.5 font-[family-name:var(--display)] text-[22.5px] font-extrabold uppercase leading-[1.1] tracking-[-0.01em]"
          style={{ color: CT.ink }}
        >
          {ONBOARDING_TRIAL_EXHAUSTED_TITLE}
        </h2>
        <p className="mt-2.5 text-[14px] leading-snug" style={{ color: CT.ink2 }}>
          {ONBOARDING_TRIAL_EXHAUSTED_BODY}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onPurchase}
            className="w-full cursor-pointer border-none py-3.5 font-[family-name:var(--display-2)] text-xs font-extrabold uppercase tracking-[0.06em]"
            style={{ background: CT.forest, color: CT.gold }}
          >
            {ONBOARDING_TRIAL_EXHAUSTED_CTA}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="w-full cursor-pointer border py-3 font-[family-name:var(--display-2)] text-xs font-bold uppercase tracking-[0.06em]"
            style={{ borderColor: CT.hairline, background: "transparent", color: CT.ink }}
          >
            {ONBOARDING_TRIAL_EXHAUSTED_DISMISS}
          </button>
        </div>
      </div>
    </div>
  );
}
