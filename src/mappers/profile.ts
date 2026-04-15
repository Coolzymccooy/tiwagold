import type {
  BrokerConnectionSummaryDto,
  NotificationPreferencesDto,
  UpdateProfileRequestDto,
  UploadAvatarResponseDto,
  UserProfileDto,
} from "@/types/dto";
import type { BrokerConnection } from "@/types/broker";
import type {
  NotificationPreferences,
  UserProfile,
} from "@/types/user";

import {
  fromMoneyOrNull,
  fromOptional,
  toMoneyOrUndefined,
  toOptional,
} from "./primitives";

export function notificationPrefsFromDto(
  dto: NotificationPreferencesDto,
): NotificationPreferences {
  return {
    signalAlerts: dto.signal_alerts,
    riskBlocks: dto.risk_blocks,
    dailyRecap: dto.daily_recap,
    macroRadar: dto.macro_radar,
  };
}

export function notificationPrefsToDto(
  domain: NotificationPreferences,
): NotificationPreferencesDto {
  return {
    signal_alerts: domain.signalAlerts,
    risk_blocks: domain.riskBlocks,
    daily_recap: domain.dailyRecap,
    macro_radar: domain.macroRadar,
  };
}

function partialNotificationsToDto(
  domain: Partial<NotificationPreferences>,
): Partial<NotificationPreferencesDto> {
  const out: Partial<NotificationPreferencesDto> = {};
  if (domain.signalAlerts !== undefined) out.signal_alerts = domain.signalAlerts;
  if (domain.riskBlocks !== undefined) out.risk_blocks = domain.riskBlocks;
  if (domain.dailyRecap !== undefined) out.daily_recap = domain.dailyRecap;
  if (domain.macroRadar !== undefined) out.macro_radar = domain.macroRadar;
  return out;
}

export function brokerSummaryFromDto(
  dto: BrokerConnectionSummaryDto,
): BrokerConnection {
  return {
    connectionId: dto.connection_id,
    kind: dto.kind,
    accountLabel: dto.account_label,
    status: dto.status,
    connected: dto.connected,
    lastSyncedAt: toOptional(dto.last_synced_at),
    balance: toMoneyOrUndefined(dto.balance),
    equity: toMoneyOrUndefined(dto.equity),
    currency: toOptional(dto.currency),
  };
}

export function brokerSummaryToDto(
  domain: BrokerConnection,
): BrokerConnectionSummaryDto {
  return {
    connection_id: domain.connectionId,
    kind: domain.kind,
    account_label: domain.accountLabel,
    status: domain.status,
    connected: domain.connected,
    last_synced_at: fromOptional(domain.lastSyncedAt),
    balance: fromMoneyOrNull(domain.balance),
    equity: fromMoneyOrNull(domain.equity),
    currency: fromOptional(domain.currency),
  };
}

export function userProfileFromDto(dto: UserProfileDto): UserProfile {
  return {
    id: dto.id,
    email: dto.email,
    displayName: dto.display_name,
    tier: dto.tier,
    createdAt: dto.created_at,
    onboardingCompletedAt: toOptional(dto.onboarding_completed_at),
    broker: dto.broker ? brokerSummaryFromDto(dto.broker) : undefined,
    notifications: notificationPrefsFromDto(dto.notifications),
    riskProfile: dto.risk_profile,
    avatarUrl: toOptional(dto.avatar_url),
    locale: toOptional(dto.locale),
    timezone: toOptional(dto.timezone),
  };
}

export function userProfileToDto(domain: UserProfile): UserProfileDto {
  return {
    id: domain.id,
    email: domain.email,
    display_name: domain.displayName,
    tier: domain.tier,
    created_at: domain.createdAt,
    onboarding_completed_at: fromOptional(domain.onboardingCompletedAt),
    broker: domain.broker ? brokerSummaryToDto(domain.broker) : null,
    notifications: notificationPrefsToDto(domain.notifications),
    risk_profile: domain.riskProfile,
    avatar_url: fromOptional(domain.avatarUrl),
    locale: fromOptional(domain.locale),
    timezone: fromOptional(domain.timezone),
  };
}

export interface UpdateProfileInput {
  displayName?: string;
  notifications?: Partial<NotificationPreferences>;
  riskProfile?: UserProfile["riskProfile"];
  locale?: string;
  timezone?: string;
}

export function updateProfileRequestToDto(
  input: UpdateProfileInput,
): UpdateProfileRequestDto {
  const out: UpdateProfileRequestDto = {};
  if (input.displayName !== undefined) out.display_name = input.displayName;
  if (input.notifications !== undefined)
    out.notifications = partialNotificationsToDto(input.notifications);
  if (input.riskProfile !== undefined) out.risk_profile = input.riskProfile;
  if (input.locale !== undefined) out.locale = input.locale;
  if (input.timezone !== undefined) out.timezone = input.timezone;
  return out;
}

export interface UploadAvatarResult {
  avatarUrl: string;
  updatedAt: string;
}

export function uploadAvatarResponseFromDto(
  dto: UploadAvatarResponseDto,
): UploadAvatarResult {
  return {
    avatarUrl: dto.avatar_url,
    updatedAt: dto.updated_at,
  };
}
