export type OnboardingStepId = "welcome" | "risk" | "broker";

export type RiskProfileId = "conservative" | "balanced" | "aggressive";

export interface OnboardingState {
  stepIndex: number;
  riskProfile: RiskProfileId | null;
  brokerConnected: boolean;
}
