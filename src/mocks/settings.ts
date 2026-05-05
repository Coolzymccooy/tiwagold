import type { EngineSettings, RiskSettings } from "@/types/settings";
import {
  defaultEngineSettings,
  defaultRiskSettings,
} from "@/types/settings";

export const MOCK_RISK_SETTINGS: RiskSettings = {
  ...defaultRiskSettings,
  maxRiskPercent: 0.75,
  allowedSessions: ["london", "new_york"],
  maxOpenPositions: 2,
};

export const MOCK_ENGINE_SETTINGS: EngineSettings = {
  ...defaultEngineSettings,
  autoApprove: false,
  cooldownMinutes: 25,
  engines: [
    { tier: "conservative", enabled: true, minScore: 74 },
    { tier: "aggressive", enabled: true, minScore: 80 },
  ],
};
