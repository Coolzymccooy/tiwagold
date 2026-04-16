import { COPY } from "@/content/copy";
import type { OnboardingSlide, OnboardingSlideId, OnboardingState } from "./types";

export const ONBOARDING_SLIDES: readonly OnboardingSlide[] =
  COPY.onboarding.slides.map((slide) => ({
    id: slide.id as OnboardingSlideId,
    eyebrow: slide.eyebrow,
    title: slide.title,
    body: slide.body,
  }));

export const ONBOARDING_SLIDE_COUNT = ONBOARDING_SLIDES.length;

export const onboardingInitialState: OnboardingState = {
  slideIndex: 0,
};

function clampIndex(index: number): number {
  if (index < 0) return 0;
  if (index > ONBOARDING_SLIDE_COUNT - 1) return ONBOARDING_SLIDE_COUNT - 1;
  return index;
}

export function selectCurrentSlide(state: OnboardingState): OnboardingSlide {
  const index = clampIndex(state.slideIndex);
  const slide = ONBOARDING_SLIDES[index];
  if (!slide) {
    throw new Error("Onboarding slides are empty");
  }
  return slide;
}

export function selectIsLastSlide(state: OnboardingState): boolean {
  return state.slideIndex >= ONBOARDING_SLIDE_COUNT - 1;
}

export function selectIsFirstSlide(state: OnboardingState): boolean {
  return state.slideIndex <= 0;
}

export function selectProgress(state: OnboardingState): number {
  if (ONBOARDING_SLIDE_COUNT <= 1) return 1;
  return (clampIndex(state.slideIndex) + 1) / ONBOARDING_SLIDE_COUNT;
}
