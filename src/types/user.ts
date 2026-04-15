import type { BrokerConnection } from "./broker";

export type UserTier = "founder" | "pro" | "trial";

export interface NotificationPreferences {
  signalAlerts: boolean;
  riskBlocks: boolean;
  dailyRecap: boolean;
  macroRadar: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  tier: UserTier;
  createdAt: string;
  onboardingCompletedAt?: string;
  broker?: BrokerConnection;
  notifications: NotificationPreferences;
  riskProfile: "cautious" | "balanced" | "aggressive";
  avatarUrl?: string;
  locale?: string;
  timezone?: string;
}
