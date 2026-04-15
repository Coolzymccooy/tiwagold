import type {
  KillSwitchConfirmationRequestDto,
  KillSwitchConfirmationResultDto,
  KillSwitchStatusDto,
} from "@/types/dto";
import type {
  KillSwitchConfirmationInput,
  KillSwitchConfirmationResult,
  KillSwitchStatus,
} from "@/types/safety";

import { toOptional } from "./primitives";

export function killSwitchStatusFromDto(
  dto: KillSwitchStatusDto,
): KillSwitchStatus {
  return {
    state: dto.state,
    trippedAt: toOptional(dto.tripped_at),
    trippedReason: toOptional(dto.tripped_reason),
    trippedBy: toOptional(dto.tripped_by),
    cooldownUntil: toOptional(dto.cooldown_until),
    allowTradesAfter: toOptional(dto.allow_trades_after),
    openPositionCount: dto.open_position_count,
    pendingOrderCount: dto.pending_order_count,
  };
}

export function killSwitchConfirmationRequestToDto(
  input: KillSwitchConfirmationInput,
): KillSwitchConfirmationRequestDto {
  return {
    intent_token: input.intentToken,
    confirmation_phrase: input.confirmationPhrase,
    reason: input.reason,
  };
}

export function killSwitchConfirmationResultFromDto(
  dto: KillSwitchConfirmationResultDto,
): KillSwitchConfirmationResult {
  return {
    accepted: dto.accepted,
    status: killSwitchStatusFromDto(dto.status),
    cancelledOrders: dto.cancelled_orders,
    closedPositions: dto.closed_positions,
    completedAt: dto.completed_at,
  };
}
