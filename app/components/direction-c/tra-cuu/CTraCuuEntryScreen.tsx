import { useEffect, useState, type RefObject } from "react";
import { toast } from "sonner";

import { LogoMark, Mono } from "~/components/brand";
import type { TuTruIntent } from "~/lib/api-types";
import { CT } from "~/lib/c-tokens";
import { laSoJsonToRevealProps } from "~/lib/la-so-ui";
import { resolveTraCuuIntentFromText } from "~/lib/tra-cuu-intent-resolve";
import { TRA_CUU_TASK_CHIPS } from "~/lib/tra-cuu-task-chips";
import {
  DEFAULT_ONBOARDING_TRIAL_QUESTIONS_MAX,
  hasOnboardingTrialAccess,
  onboardingTrialQuestionsRemaining,
} from "~/lib/entitlements";
import type { Profile } from "~/lib/profile-context";

type CTraCuuEntryScreenProps = {
  profile: Profile | null;
  profileLoading: boolean;
  calendarLocked: boolean;
  disabled: boolean;
  initialIntent?: TuTruIntent;
  initialPillText?: string;
  scrollRef?: RefObject<HTMLDivElement | null>;
  onSubmit: (intent: TuTruIntent, intentLabel: string) => void;
  onNeedSubscription: () => void;
};

export function CTraCuuEntryScreen({
  profile,
  profileLoading,
  calendarLocked,
  disabled,
  initialIntent,
  initialPillText,
  scrollRef,
  onSubmit,
  onNeedSubscription,
}: CTraCuuEntryScreenProps) {
  const [pillText, setPillText] = useState("");
  const menh = profile ? laSoJsonToRevealProps(profile.la_so)?.menh : null;

  useEffect(() => {
    if (initialPillText) {
      setPillText(initialPillText);
      return;
    }
    if (!initialIntent) return;
    const chip = TRA_CUU_TASK_CHIPS.find((c) => c.intent === initialIntent);
    if (chip) setPillText(chip.label);
  }, [initialIntent, initialPillText]);

  function trySubmit(label: string, intent?: TuTruIntent) {
    if (calendarLocked) {
      onNeedSubscription();
      return;
    }
    if (!profile?.ngay_sinh) {
      toast.error("Cần ngày sinh trong hồ sơ.");
      return;
    }
    if (intent) {
      onSubmit(intent, label);
      return;
    }
    const resolved = resolveTraCuuIntentFromText(label);
    if (!resolved) {
      toast.error("Chọn việc từ gợi ý bên dưới.");
      return;
    }
    onSubmit(resolved.intent, resolved.label);
  }

  const formDisabled = disabled || profileLoading || !profile;
  const trialRemaining = profile
    ? onboardingTrialQuestionsRemaining(profile)
    : 0;
  const showTrialHint =
    Boolean(profile) && hasOnboardingTrialAccess(profile) && trialRemaining > 0;

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-auto px-[22px] pb-28 pt-1.5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LogoMark size={20} />
          <span
            className="text-sm font-extrabold uppercase tracking-[-0.005em]"
            style={{ fontFamily: "var(--display-2)", color: CT.ink }}
          >
            Tra cứu
          </span>
        </div>
        {menh ? (
          <span className="font-serif text-[11.5px]" style={{ color: CT.muted }}>
            lá số {menh.toLowerCase()}
          </span>
        ) : null}
      </div>

      {!profileLoading && profile && !profile.ngay_sinh ? (
        <p
          className="mt-4 font-serif text-[13.5px] leading-relaxed"
          style={{ color: CT.muted }}
        >
          Thêm ngày sinh trong hồ sơ để tra cứu ngày lành theo Bát Tự.
        </p>
      ) : null}

      <h1
        className="mt-4 text-[40px] font-extrabold uppercase leading-[0.98] tracking-[-0.015em]"
        style={{ fontFamily: "var(--display)", color: CT.ink }}
      >
        Bạn tìm ngày tốt
        <br />
        <span
          className="font-serif text-[40px] font-bold normal-case italic leading-[0.98] tracking-normal"
          style={{ color: CT.goldDeep }}
        >
          để làm việc gì?
        </span>
      </h1>

      <div
        className="mt-4 flex cursor-text items-center gap-2.5 py-3.5 pl-4 pr-3"
        style={{
          background: "#fff",
          border: `1.5px solid ${CT.goldDeep}`,
          borderRadius: 999,
          boxShadow: "0 6px 16px rgba(154,124,34,0.1)",
        }}
      >
        <input
          type="text"
          value={pillText}
          disabled={formDisabled}
          placeholder="Gõ việc bạn định làm…"
          onChange={(e) => setPillText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") trySubmit(pillText);
          }}
          className="min-w-0 flex-1 border-0 bg-transparent font-serif text-sm outline-none"
          style={{ color: CT.ink }}
        />
        <button
          type="button"
          disabled={formDisabled || !pillText.trim()}
          onClick={() => trySubmit(pillText)}
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border-none font-serif text-[17px]"
          style={{
            background: CT.forest,
            color: CT.gold,
            opacity: formDisabled || !pillText.trim() ? 0.45 : 1,
            cursor: formDisabled ? "not-allowed" : "pointer",
          }}
          aria-label="Tìm ngày"
        >
          ↑
        </button>
      </div>

      {showTrialHint ? (
        <p
          className="mt-3 font-serif text-[12.5px] leading-snug"
          style={{ color: CT.muted }}
        >
          Bạn còn{" "}
          <span style={{ color: CT.goldDeep }}>{trialRemaining}</span>/
          {DEFAULT_ONBOARDING_TRIAL_QUESTIONS_MAX} lượt chat miễn phí.
        </p>
      ) : null}

      <div className="mt-4">
        <Mono style={{ color: CT.muted, fontSize: 9 }}>Việc thường gặp</Mono>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {TRA_CUU_TASK_CHIPS.map((chip) => (
            <button
              key={chip.intent}
              type="button"
              disabled={formDisabled}
              onClick={() => {
                setPillText(chip.label);
                trySubmit(chip.label, chip.intent);
              }}
              className="cursor-pointer border px-3.5 py-2 font-serif text-[13px] disabled:opacity-60"
              style={{
                borderColor: CT.hairline,
                background: "#fff",
                color: CT.ink2,
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
