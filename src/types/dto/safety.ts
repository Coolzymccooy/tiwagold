export type KillSwitchStateDto = "armed" | "tripped" | "cooldown";

export type KillSwitchTripReasonDto =
  | "user_manual"
  | "max_daily_loss"
  | "max_drawdown"
  | "broker_disconnect"
  | "policy_violation";

export interface KillSwitchStatusDto {
  state: KillSwitchStateDto;
  tripped_at?: string | null;
  tripped_reason?: KillSwitchTripReasonDto | null;
  tripped_by?: "user" | "system" | null;
  cooldown_until?: string | null;
  allow_trades_after?: string | null;
  open_position_count: number;
  pending_order_count: number;
}

export interface KillSwitchConfirmationRequestDto {
  intent_token: string;
  confirmation_phrase: "STOP ALL TRADING";
  reason?: KillSwitchTripReasonDto;
}

export interface KillSwitchConfirmationResultDto {
  accepted: boolean;
  status: KillSwitchStatusDto;
  cancelled_orders: number;
  closed_positions: number;
  completed_at: string;
}
