import type {
  ExecutionStatusDto,
  TradeApproveRequestDto,
  TradeAutopsyDto,
  TradeDetailDto,
  TradeExecuteRequestDto,
  TradeListItemDto,
  TradeListResponseDto,
  TradeTimelineEventDto,
} from "@/types/dto";
import type {
  ExecutionStatus,
  Trade,
  TradeAutopsy,
  TradeCandidate,
  TradeTimelineEvent,
} from "@/types/trade";
import { TRADE_SYMBOL } from "@/types/trade";

import {
  candidateStatusFromDto,
  fromMoney,
  modeFromDto,
  sessionFromDto,
  sideFromDto,
  toMoney,
  toMoneyOrUndefined,
  toOptional,
} from "./primitives";

const KNOWN_TIMELINE_KINDS: readonly TradeTimelineEvent["kind"][] = [
  "created",
  "approved",
  "risk_blocked",
  "triggered",
  "tp1_hit",
  "tp2_hit",
  "stop_hit",
  "expired",
  "cancelled",
  "note",
];

function timelineKindFromDto(kind: string): TradeTimelineEvent["kind"] {
  return (KNOWN_TIMELINE_KINDS as readonly string[]).includes(kind)
    ? (kind as TradeTimelineEvent["kind"])
    : "note";
}

export function timelineEventFromDto(
  dto: TradeTimelineEventDto,
): TradeTimelineEvent {
  return {
    id: dto.id,
    at: dto.at,
    kind: timelineKindFromDto(dto.kind),
    summary: dto.summary,
    detail: toOptional(dto.detail),
  };
}

export function tradeAutopsyFromDto(dto: TradeAutopsyDto): TradeAutopsy {
  return {
    outcome: dto.rating >= 3 ? "win" : dto.rating <= 1 ? "loss" : "breakeven",
    exitPrice: 0,
    exitReason: dto.summary,
    pnl: 0,
    pnlR: 0,
    durationMinutes: 0,
    lessons: dto.lessons,
  };
}

export function executionStatusFromDto(
  dto: ExecutionStatusDto,
): ExecutionStatus {
  return {
    tradeId: dto.trade_id,
    phase: dto.phase,
    brokerTicket: dto.broker_ticket ?? null,
    filledPrice: toMoneyOrUndefined(dto.filled_price),
    filledAt: toOptional(dto.filled_at),
    slippage: toMoneyOrUndefined(dto.slippage),
    attempt: dto.attempt,
    lastCheckedAt: dto.last_checked_at,
    rejectionCode: toOptional(dto.rejection_code),
    rejectionMessage: toOptional(dto.rejection_message),
  };
}

export function tradeCandidateFromDto(
  dto: TradeListItemDto,
): TradeCandidate {
  const entry = toMoney(dto.levels.entry);
  const stopLoss = toMoney(dto.levels.stop_loss);
  const currentPrice = toMoney(dto.levels.current_price);
  const takeProfits = dto.levels.take_profit.map(toMoney);
  const tp1 = takeProfits[0] ?? entry;
  const tp2 = takeProfits[1];
  return {
    id: dto.id,
    dedupeKey: dto.id,
    symbol: TRADE_SYMBOL,
    direction: sideFromDto(dto.side),
    mode: modeFromDto(dto.context.mode),
    engineTier: dto.engine,
    strategyTag: dto.logic_version,
    setupType: "",
    sessionTag: sessionFromDto(dto.context.session),
    score: dto.score,
    proposedEntry: entry,
    stopLoss,
    tp1,
    tp2,
    riskReward: toMoney(dto.risk.reward_to_risk),
    htfTrend: "",
    ltfStructure: "",
    confluenceTags: dto.context.macro_tags,
    thesisSummary: dto.context.narrative,
    expiresAt: dto.updated_at,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    status: candidateStatusFromDto(dto.candidate_status),
    currentPrice,
  };
}

export function tradeFromDto(dto: TradeDetailDto): Trade {
  const base = tradeCandidateFromDto(dto);
  return {
    ...base,
    timeline: dto.timeline.map(timelineEventFromDto),
    autopsy:
      dto.autopsy === null || dto.autopsy === undefined
        ? undefined
        : tradeAutopsyFromDto(dto.autopsy),
  };
}

export interface TradeListPage {
  trades: TradeCandidate[];
  nextCursor?: string;
}

export function tradeListFromDto(dto: TradeListResponseDto): TradeListPage {
  return {
    trades: dto.trades.map(tradeCandidateFromDto),
    nextCursor: toOptional(dto.next_cursor),
  };
}

export interface ApproveTradeInput {
  intentToken: string;
  note?: string;
}

export function approveRequestToDto(
  input: ApproveTradeInput,
): TradeApproveRequestDto {
  const dto: TradeApproveRequestDto = { intent_token: input.intentToken };
  if (input.note !== undefined) {
    dto.note = input.note;
  }
  return dto;
}

export interface ExecuteTradeInput {
  intentToken: string;
  overrideLots?: number;
}

export function executeRequestToDto(
  input: ExecuteTradeInput,
): TradeExecuteRequestDto {
  const dto: TradeExecuteRequestDto = { intent_token: input.intentToken };
  if (input.overrideLots !== undefined) {
    dto.override_lots = fromMoney(input.overrideLots, 2);
  }
  return dto;
}
