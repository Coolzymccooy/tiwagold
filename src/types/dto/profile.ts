export interface UserProfileDto {
  id: string;
  email: string;
  display_name: string;
  tier: "founder" | "pro" | "trial";
  created_at: string;
  onboarding_completed_at?: string | null;
  broker?: BrokerConnectionSummaryDto | null;
  notifications: NotificationPreferencesDto;
  risk_profile: "cautious" | "balanced" | "aggressive";
  avatar_url?: string | null;
  locale?: string | null;
  timezone?: string | null;
}

export interface NotificationPreferencesDto {
  signal_alerts: boolean;
  risk_blocks: boolean;
  daily_recap: boolean;
  macro_radar: boolean;
}

export interface BrokerConnectionSummaryDto {
  connection_id: string;
  kind: "mt5" | "oanda" | "ctrader" | "paper";
  account_label: string;
  status:
    | "disconnected"
    | "connecting"
    | "connected"
    | "degraded"
    | "error";
  connected: boolean;
  last_synced_at?: string | null;
  balance?: string | null;
  equity?: string | null;
  currency?: string | null;
}

export interface UpdateProfileRequestDto {
  display_name?: string;
  notifications?: Partial<NotificationPreferencesDto>;
  risk_profile?: "cautious" | "balanced" | "aggressive";
  locale?: string;
  timezone?: string;
}

export interface UploadAvatarResponseDto {
  avatar_url: string;
  updated_at: string;
}
