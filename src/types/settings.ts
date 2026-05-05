import type { EngineTier } from "./trade";

export type { RiskSettings, SessionName } from "./trade";
export { defaultRiskSettings } from "./trade";

export interface EngineToggle {
  tier: EngineTier;
  enabled: boolean;
  minScore: number;
}

export interface EngineSettings {
  engines: EngineToggle[];
  autoApprove: boolean;
  autoApproveMinScore?: number;
  cooldownMinutes: number;
}

export const defaultEngineSettings: EngineSettings = {
  engines: [
    { tier: "conservative", enabled: true, minScore: 72 },
    { tier: "aggressive", enabled: true, minScore: 78 },
  ],
  autoApprove: false,
  cooldownMinutes: 20,
};
