import type { BrokerConnection } from "@/types/broker";
import type { NotificationPreferences, UserProfile } from "@/types/user";

export interface SettingsProfileRow {
  displayName: string;
  email: string;
  tierLabel: string;
  memberSinceLabel: string;
  isDemo: boolean;
  demoNote: string | null;
}

export interface SettingsBrokerRow {
  connected: boolean;
  statusLabel: string;
  accountLabel: string | null;
  kindLabel: string | null;
  balanceLabel: string | null;
  equityLabel: string | null;
  lastSyncedLabel: string | null;
  broker: BrokerConnection | null;
}

export type NotificationToggleId = keyof NotificationPreferences;

export interface SettingsNotificationRow {
  id: NotificationToggleId;
  label: string;
  enabled: boolean;
}

export type RiskProfileId = UserProfile["riskProfile"];

export interface SettingsRiskRow {
  id: RiskProfileId;
  label: string;
  hint: string;
  selected: boolean;
}

export type LegalLinkId = "terms" | "privacy" | "disclaimer";

export interface SettingsLegalRow {
  id: LegalLinkId;
  label: string;
}

export interface SettingsView {
  profile: SettingsProfileRow;
  broker: SettingsBrokerRow;
  notifications: SettingsNotificationRow[];
  risk: SettingsRiskRow[];
  legal: SettingsLegalRow[];
}
