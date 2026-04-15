import type { OnboardingState } from "../types";

import {
  ONBOARDING_STEP_COUNT,
  onboardingInitialState,
  selectCanAdvance,
  selectCurrentStepId,
  selectIsLastStep,
  selectProgress,
} from "../selectors";

function makeState(overrides: Partial<OnboardingState> = {}): OnboardingState {
  return { ...onboardingInitialState, ...overrides };
}

describe("onboarding selectors — onboardingInitialState", () => {
  it("starts at step 0 with no risk profile and broker disconnected", () => {
    expect(onboardingInitialState).toEqual({
      stepIndex: 0,
      riskProfile: null,
      brokerConnected: false,
    });
  });
});

describe("onboarding selectors — selectCurrentStepId", () => {
  it("returns 'welcome' at stepIndex 0", () => {
    expect(selectCurrentStepId(makeState({ stepIndex: 0 }))).toBe("welcome");
  });

  it("returns 'risk' at stepIndex 1", () => {
    expect(selectCurrentStepId(makeState({ stepIndex: 1 }))).toBe("risk");
  });

  it("returns 'broker' at stepIndex 2", () => {
    expect(selectCurrentStepId(makeState({ stepIndex: 2 }))).toBe("broker");
  });

  it("falls back to 'welcome' when stepIndex is out of range", () => {
    expect(selectCurrentStepId(makeState({ stepIndex: 99 }))).toBe("welcome");
  });
});

describe("onboarding selectors — selectCanAdvance", () => {
  it("allows advancing from 'welcome' unconditionally", () => {
    expect(selectCanAdvance(makeState({ stepIndex: 0 }))).toBe(true);
  });

  it("blocks 'risk' step until a riskProfile is set", () => {
    expect(
      selectCanAdvance(makeState({ stepIndex: 1, riskProfile: null })),
    ).toBe(false);
    expect(
      selectCanAdvance(
        makeState({ stepIndex: 1, riskProfile: "balanced" }),
      ),
    ).toBe(true);
  });

  it("blocks 'broker' step until brokerConnected is true", () => {
    expect(
      selectCanAdvance(
        makeState({ stepIndex: 2, brokerConnected: false }),
      ),
    ).toBe(false);
    expect(
      selectCanAdvance(
        makeState({ stepIndex: 2, brokerConnected: true }),
      ),
    ).toBe(true);
  });
});

describe("onboarding selectors — selectIsLastStep", () => {
  it("returns false when not on the last step", () => {
    expect(selectIsLastStep(makeState({ stepIndex: 0 }))).toBe(false);
    expect(selectIsLastStep(makeState({ stepIndex: 1 }))).toBe(false);
  });

  it("returns true when on the final step", () => {
    expect(
      selectIsLastStep(makeState({ stepIndex: ONBOARDING_STEP_COUNT - 1 })),
    ).toBe(true);
  });

  it("returns true when stepIndex overshoots", () => {
    expect(selectIsLastStep(makeState({ stepIndex: 99 }))).toBe(true);
  });
});

describe("onboarding selectors — selectProgress", () => {
  it("returns fractional progress based on stepIndex", () => {
    expect(selectProgress(makeState({ stepIndex: 0 }))).toBeCloseTo(
      1 / ONBOARDING_STEP_COUNT,
    );
    expect(selectProgress(makeState({ stepIndex: 1 }))).toBeCloseTo(
      2 / ONBOARDING_STEP_COUNT,
    );
  });

  it("returns 1 on the last step", () => {
    expect(
      selectProgress(makeState({ stepIndex: ONBOARDING_STEP_COUNT - 1 })),
    ).toBe(1);
  });
});
