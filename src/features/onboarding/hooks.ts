import { useCallback, useState } from "react";
import { useAuthStore } from "@/state/authStore";
import {
  ONBOARDING_SLIDE_COUNT,
  onboardingInitialState,
  selectCurrentSlide,
  selectIsFirstSlide,
  selectIsLastSlide,
  selectProgress,
} from "./selectors";
import type { OnboardingSlide, OnboardingState } from "./types";

export interface UseOnboardingResult {
  state: OnboardingState;
  currentSlide: OnboardingSlide;
  isFirstSlide: boolean;
  isLastSlide: boolean;
  progress: number;
  totalSlides: number;
  next: () => void;
  back: () => void;
  skip: () => void;
  finish: () => void;
  goTo: (index: number) => void;
}

function clampIndex(index: number): number {
  if (index < 0) return 0;
  if (index > ONBOARDING_SLIDE_COUNT - 1) return ONBOARDING_SLIDE_COUNT - 1;
  return index;
}

export function useOnboarding(): UseOnboardingResult {
  const [state, setState] = useState<OnboardingState>(onboardingInitialState);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  const finish = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const next = useCallback(() => {
    setState((prev) => {
      if (selectIsLastSlide(prev)) {
        completeOnboarding();
        return prev;
      }
      return { ...prev, slideIndex: clampIndex(prev.slideIndex + 1) };
    });
  }, [completeOnboarding]);

  const back = useCallback(() => {
    setState((prev) => ({ ...prev, slideIndex: clampIndex(prev.slideIndex - 1) }));
  }, []);

  const skip = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const goTo = useCallback((index: number) => {
    setState((prev) => ({ ...prev, slideIndex: clampIndex(index) }));
  }, []);

  return {
    state,
    currentSlide: selectCurrentSlide(state),
    isFirstSlide: selectIsFirstSlide(state),
    isLastSlide: selectIsLastSlide(state),
    progress: selectProgress(state),
    totalSlides: ONBOARDING_SLIDE_COUNT,
    next,
    back,
    skip,
    finish,
    goTo,
  };
}
