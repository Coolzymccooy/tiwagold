import { COPY } from "@/content/copy";
import type { OnboardingState, OnboardingStepId } from "./types";

export const ONBOARDING_STEP_COUNT = COPY.onboarding.steps.length;

export const onboardingInitialState: OnboardingState = {
  stepIndex: 0,
  riskProfile: null,
  brokerConnected: false,
};

export function selectCurrentStepId(state: OnboardingState): OnboardingStepId {
  const step = COPY.onboarding.steps[state.stepIndex];
  return (step?.id ?? "welcome") as OnboardingStepId;
}

export function selectCanAdvance(state: OnboardingState): boolean {
  const id = selectCurrentStepId(state);
  if (id === "risk") return state.riskProfile !== null;
  if (id === "broker") return state.brokerConnected;
  return true;
}

export function selectIsLastStep(state: OnboardingState): boolean {
  return state.stepIndex >= ONBOARDING_STEP_COUNT - 1;
}

export function selectProgress(state: OnboardingState): number {
  if (ONBOARDING_STEP_COUNT <= 1) return 1;
  return (state.stepIndex + 1) / ONBOARDING_STEP_COUNT;
}
