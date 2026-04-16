export type OnboardingSlideId = "engines" | "execution" | "ai";

export interface OnboardingSlide {
  id: OnboardingSlideId;
  eyebrow: string;
  title: string;
  body: string;
}

export interface OnboardingState {
  slideIndex: number;
}
