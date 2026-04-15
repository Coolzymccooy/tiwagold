import type { EngineTierDto, SessionNameDto } from "./trades";

export interface RiskSettingsDto {
  max_risk_per_trade_pct: string;
  max_daily_drawdown_pct: string;
  max_open_positions: number;
  allowed_sessions: SessionNameDto[];
  cooldown_after_loss_minutes: number;
}

export interface UpdateRiskSettingsRequestDto {
  max_risk_per_trade_pct?: string;
  max_daily_drawdown_pct?: string;
  max_open_positions?: number;
  allowed_sessions?: SessionNameDto[];
  cooldown_after_loss_minutes?: number;
}

export interface EngineToggleDto {
  tier: EngineTierDto;
  enabled: boolean;
  min_score: number;
}

export interface EngineSettingsDto {
  engines: EngineToggleDto[];
  auto_approve: boolean;
  auto_approve_min_score?: number | null;
  cooldown_minutes: number;
}

export interface UpdateEngineSettingsRequestDto {
  engines?: EngineToggleDto[];
  auto_approve?: boolean;
  auto_approve_min_score?: number | null;
  cooldown_minutes?: number;
}
