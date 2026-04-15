import { useCallback, useState } from "react";
import { useAuthStore } from "@/state/authStore";
import {
  ONBOARDING_STEP_COUNT,
  onboardingInitialState,
  selectCanAdvance,
  selectCurrentStepId,
  selectIsLastStep,
  selectProgress,
} from "./selectors";
import type { OnboardingState, RiskProfileId } from "./types";

export interface UseOnboardingResult {
  state: OnboardingState;
  stepId: ReturnType<typeof selectCurrentStepId>;
  canAdvance: boolean;
  isLastStep: boolean;
  progress: number;
  setRiskProfile: (id: RiskProfileId) => void;
  markBrokerConnected: () => void;
  next: () => void;
  back: () => void;
}

export function useOnboarding(): UseOnboardingResult {
  const [state, setState] = useState<OnboardingState>(onboardingInitialState);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  const setRiskProfile = useCallback((id: RiskProfileId) => {
    setState((prev) => ({ ...prev, riskProfile: id }));
  }, []);

  const markBrokerConnected = useCallback(() => {
    setState((prev) => ({ ...prev, brokerConnected: true }));
  }, []);

  const next = useCallback(() => {
    setState((prev) => {
      if (!selectCanAdvance(prev)) return prev;
      if (selectIsLastStep(prev)) {
        completeOnboarding();
        return prev;
      }
      return { ...prev, stepIndex: Math.min(prev.stepIndex + 1, ONBOARDING_STEP_COUNT - 1) };
    });
  }, [completeOnboarding]);

  const back = useCallback(() => {
    setState((prev) => ({ ...prev, stepIndex: Math.max(prev.stepIndex - 1, 0) }));
  }, []);

  return {
    state,
    stepId: selectCurrentStepId(state),
    canAdvance: selectCanAdvance(state),
    isLastStep: selectIsLastStep(state),
    progress: selectProgress(state),
    setRiskProfile,
    markBrokerConnected,
    next,
    back,
  };
}
