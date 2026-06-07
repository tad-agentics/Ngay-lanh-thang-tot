import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router";

import { COnboardingTrialExhaustedModal } from "~/components/direction-c/COnboardingTrialExhaustedModal";
import { useProfile } from "~/hooks/useProfile";
import {
  isNeverSubscribedUser,
  onboardingTrialQuestionsRemaining,
} from "~/lib/entitlements";

type OnboardingTrialExhaustedContextValue = {
  showOnboardingTrialExhaustedModal: () => void;
};

const OnboardingTrialExhaustedContext =
  createContext<OnboardingTrialExhaustedContextValue | null>(null);

export function OnboardingTrialExhaustedProvider({
  children,
}: {
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);
  const prevRemainingRef = useRef<number | null>(null);

  const showOnboardingTrialExhaustedModal = useCallback(() => {
    setOpen(true);
  }, []);

  const dismissOnboardingTrialExhaustedModal = useCallback(() => {
    setOpen(false);
  }, []);

  const purchaseFromOnboardingTrialExhaustedModal = useCallback(() => {
    setOpen(false);
    navigate("/dat-lich");
  }, [navigate]);

  useEffect(() => {
    if (!profile || !isNeverSubscribedUser(profile)) {
      prevRemainingRef.current = null;
      return;
    }
    const remaining = onboardingTrialQuestionsRemaining(profile);
    const prev = prevRemainingRef.current;
    if (prev !== null && prev > 0 && remaining === 0) {
      setOpen(true);
    }
    prevRemainingRef.current = remaining;
  }, [profile?.onboarding_trial_questions_used, profile?.subscription_expires_at]);

  return (
    <OnboardingTrialExhaustedContext.Provider
      value={{ showOnboardingTrialExhaustedModal }}
    >
      {children}
      <COnboardingTrialExhaustedModal
        open={open}
        onDismiss={dismissOnboardingTrialExhaustedModal}
        onPurchase={purchaseFromOnboardingTrialExhaustedModal}
      />
    </OnboardingTrialExhaustedContext.Provider>
  );
}

export function useOnboardingTrialExhaustedModal(): OnboardingTrialExhaustedContextValue {
  const ctx = useContext(OnboardingTrialExhaustedContext);
  if (!ctx) {
    return { showOnboardingTrialExhaustedModal: () => {} };
  }
  return ctx;
}
