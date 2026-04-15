import type {
  EngineSettingsDto,
  EngineToggleDto,
  RiskSettingsDto,
  UpdateEngineSettingsRequestDto,
  UpdateRiskSettingsRequestDto,
} from "@/types/dto";
import type {
  EngineSettings,
  EngineToggle,
  RiskSettings,
} from "@/types/settings";
import { defaultRiskSettings } from "@/types/trade";

import { fromMoney, sessionFromDto, sessionToDto, toMoney } from "./primitives";

export function riskSettingsFromDto(dto: RiskSettingsDto): RiskSettings {
  return {
    minRR: defaultRiskSettings.minRR,
    maxRiskPercent: toMoney(dto.max_risk_per_trade_pct),
    allowedSessions: dto.allowed_sessions.map(sessionFromDto),
    maxDataAgeMinutes: defaultRiskSettings.maxDataAgeMinutes,
    maxDailyDrawdownPct: toMoney(dto.max_daily_drawdown_pct),
    maxOpenPositions: dto.max_open_positions,
    cooldownAfterLossMinutes: dto.cooldown_after_loss_minutes,
  };
}

export function riskSettingsToDto(domain: RiskSettings): RiskSettingsDto {
  return {
    max_risk_per_trade_pct: fromMoney(domain.maxRiskPercent),
    max_daily_drawdown_pct: fromMoney(domain.maxDailyDrawdownPct),
    max_open_positions: domain.maxOpenPositions,
    allowed_sessions: domain.allowedSessions.map(sessionToDto),
    cooldown_after_loss_minutes: domain.cooldownAfterLossMinutes,
  };
}

export interface UpdateRiskSettingsInput {
  maxRiskPercent?: number;
  maxDailyDrawdownPct?: number;
  maxOpenPositions?: number;
  allowedSessions?: RiskSettings["allowedSessions"];
  cooldownAfterLossMinutes?: number;
}

export function updateRiskSettingsRequestToDto(
  patch: UpdateRiskSettingsInput,
): UpdateRiskSettingsRequestDto {
  const dto: UpdateRiskSettingsRequestDto = {};
  if (patch.maxRiskPercent !== undefined) {
    dto.max_risk_per_trade_pct = fromMoney(patch.maxRiskPercent);
  }
  if (patch.maxDailyDrawdownPct !== undefined) {
    dto.max_daily_drawdown_pct = fromMoney(patch.maxDailyDrawdownPct);
  }
  if (patch.maxOpenPositions !== undefined) {
    dto.max_open_positions = patch.maxOpenPositions;
  }
  if (patch.allowedSessions !== undefined) {
    dto.allowed_sessions = patch.allowedSessions.map(sessionToDto);
  }
  if (patch.cooldownAfterLossMinutes !== undefined) {
    dto.cooldown_after_loss_minutes = patch.cooldownAfterLossMinutes;
  }
  return dto;
}

export function engineToggleFromDto(dto: EngineToggleDto): EngineToggle {
  return {
    tier: dto.tier,
    enabled: dto.enabled,
    minScore: dto.min_score,
  };
}

export function engineToggleToDto(domain: EngineToggle): EngineToggleDto {
  return {
    tier: domain.tier,
    enabled: domain.enabled,
    min_score: domain.minScore,
  };
}

export function engineSettingsFromDto(
  dto: EngineSettingsDto,
): EngineSettings {
  return {
    engines: dto.engines.map(engineToggleFromDto),
    autoApprove: dto.auto_approve,
    autoApproveMinScore:
      dto.auto_approve_min_score === null ||
      dto.auto_approve_min_score === undefined
        ? undefined
        : dto.auto_approve_min_score,
    cooldownMinutes: dto.cooldown_minutes,
  };
}

export function engineSettingsToDto(
  domain: EngineSettings,
): EngineSettingsDto {
  return {
    engines: domain.engines.map(engineToggleToDto),
    auto_approve: domain.autoApprove,
    auto_approve_min_score: domain.autoApproveMinScore ?? null,
    cooldown_minutes: domain.cooldownMinutes,
  };
}

export interface UpdateEngineSettingsInput {
  engines?: EngineToggle[];
  autoApprove?: boolean;
  autoApproveMinScore?: number | null;
  cooldownMinutes?: number;
}

export function updateEngineSettingsRequestToDto(
  patch: UpdateEngineSettingsInput,
): UpdateEngineSettingsRequestDto {
  const dto: UpdateEngineSettingsRequestDto = {};
  if (patch.engines !== undefined) {
    dto.engines = patch.engines.map(engineToggleToDto);
  }
  if (patch.autoApprove !== undefined) {
    dto.auto_approve = patch.autoApprove;
  }
  if (patch.autoApproveMinScore !== undefined) {
    dto.auto_approve_min_score = patch.autoApproveMinScore;
  }
  if (patch.cooldownMinutes !== undefined) {
    dto.cooldown_minutes = patch.cooldownMinutes;
  }
  return dto;
}
