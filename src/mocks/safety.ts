import type {
  KillSwitchConfirmationResult,
  KillSwitchStatus,
} from "@/types/safety";

export const MOCK_KILL_SWITCH_ARMED: KillSwitchStatus = {
  state: "armed",
  openPositionCount: 1,
  pendingOrderCount: 2,
};

export const MOCK_KILL_SWITCH_TRIPPED: KillSwitchStatus = {
  state: "tripped",
  trippedAt: "2026-04-14T00:41:12.000Z",
  trippedReason: "max_daily_loss",
  trippedBy: "system",
  cooldownUntil: "2026-04-14T04:41:12.000Z",
  allowTradesAfter: "2026-04-14T04:41:12.000Z",
  openPositionCount: 0,
  pendingOrderCount: 0,
};

export const MOCK_KILL_SWITCH_CONFIRMATION_RESULT: KillSwitchConfirmationResult = {
  accepted: true,
  status: MOCK_KILL_SWITCH_TRIPPED,
  cancelledOrders: 2,
  closedPositions: 1,
  completedAt: "2026-04-14T00:41:13.000Z",
};
