export type KillSwitchState = "armed" | "tripped" | "cooldown";

export type KillSwitchTripReason =
  | "user_manual"
  | "max_daily_loss"
  | "max_drawdown"
  | "broker_disconnect"
  | "policy_violation";

export interface KillSwitchStatus {
  state: KillSwitchState;
  trippedAt?: string;
  trippedReason?: KillSwitchTripReason;
  trippedBy?: "user" | "system";
  cooldownUntil?: string;
  allowTradesAfter?: string;
  openPositionCount: number;
  pendingOrderCount: number;
}

export interface KillSwitchConfirmationInput {
  intentToken: string;
  confirmationPhrase: "STOP ALL TRADING";
  reason?: KillSwitchTripReason;
}

export interface KillSwitchConfirmationResult {
  accepted: boolean;
  status: KillSwitchStatus;
  cancelledOrders: number;
  closedPositions: number;
  completedAt: string;
}
