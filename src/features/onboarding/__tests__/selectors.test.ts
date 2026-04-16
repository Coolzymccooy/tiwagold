import type { OnboardingState } from "../types";

import {
  ONBOARDING_SLIDE_COUNT,
  ONBOARDING_SLIDES,
  onboardingInitialState,
  selectCurrentSlide,
  selectIsFirstSlide,
  selectIsLastSlide,
  selectProgress,
} from "../selectors";

function makeState(overrides: Partial<OnboardingState> = {}): OnboardingState {
  return { ...onboardingInitialState, ...overrides };
}

describe("onboarding selectors — onboardingInitialState", () => {
  it("starts at slideIndex 0", () => {
    expect(onboardingInitialState).toEqual({ slideIndex: 0 });
  });
});

describe("onboarding selectors — ONBOARDING_SLIDES", () => {
  it("exposes the three MVP slides in order", () => {
    expect(ONBOARDING_SLIDES.map((slide) => slide.id)).toEqual([
      "engines",
      "execution",
      "ai",
    ]);
  });

  it("each slide carries eyebrow, title, and body copy", () => {
    for (const slide of ONBOARDING_SLIDES) {
      expect(slide.eyebrow.length).toBeGreaterThan(0);
      expect(slide.title.length).toBeGreaterThan(0);
      expect(slide.body.length).toBeGreaterThan(0);
    }
  });
});

describe("onboarding selectors — selectCurrentSlide", () => {
  it("returns the slide at the current slideIndex", () => {
    expect(selectCurrentSlide(makeState({ slideIndex: 0 })).id).toBe("engines");
    expect(selectCurrentSlide(makeState({ slideIndex: 1 })).id).toBe(
      "execution",
    );
    expect(selectCurrentSlide(makeState({ slideIndex: 2 })).id).toBe("ai");
  });

  it("clamps overshoot to the last slide", () => {
    expect(selectCurrentSlide(makeState({ slideIndex: 99 })).id).toBe("ai");
  });

  it("clamps negative values to the first slide", () => {
    expect(selectCurrentSlide(makeState({ slideIndex: -5 })).id).toBe(
      "engines",
    );
  });
});

describe("onboarding selectors — selectIsFirstSlide", () => {
  it("returns true at slideIndex 0", () => {
    expect(selectIsFirstSlide(makeState({ slideIndex: 0 }))).toBe(true);
  });

  it("returns false after the first slide", () => {
    expect(selectIsFirstSlide(makeState({ slideIndex: 1 }))).toBe(false);
  });
});

describe("onboarding selectors — selectIsLastSlide", () => {
  it("returns false when not on the last slide", () => {
    expect(selectIsLastSlide(makeState({ slideIndex: 0 }))).toBe(false);
    expect(selectIsLastSlide(makeState({ slideIndex: 1 }))).toBe(false);
  });

  it("returns true when on the final slide", () => {
    expect(
      selectIsLastSlide(makeState({ slideIndex: ONBOARDING_SLIDE_COUNT - 1 })),
    ).toBe(true);
  });

  it("returns true when slideIndex overshoots", () => {
    expect(selectIsLastSlide(makeState({ slideIndex: 99 }))).toBe(true);
  });
});

describe("onboarding selectors — selectProgress", () => {
  it("returns fractional progress based on slideIndex", () => {
    expect(selectProgress(makeState({ slideIndex: 0 }))).toBeCloseTo(
      1 / ONBOARDING_SLIDE_COUNT,
    );
    expect(selectProgress(makeState({ slideIndex: 1 }))).toBeCloseTo(
      2 / ONBOARDING_SLIDE_COUNT,
    );
  });

  it("returns 1 on the last slide", () => {
    expect(
      selectProgress(makeState({ slideIndex: ONBOARDING_SLIDE_COUNT - 1 })),
    ).toBe(1);
  });
});
