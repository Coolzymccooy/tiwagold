export type TradeSideDto = "buy" | "sell";
export type TradeStatusDto =
  | "pending"
  | "active"
  | "filled"
  | "partial"
  | "closed"
  | "cancelled"
  | "rejected";
export type EngineTierDto = "conservative" | "aggressive";
export type SessionNameDto = "asia" | "london" | "new_york" | "overlap";
export type TradeModeDto = "scalp" | "intraday" | "swing";
export type CandidateStatusDto =
  | "queued"
  | "approved"
  | "rejected"
  | "expired"
  | "cancelled";

export interface TradeLevelsDto {
  entry: string;
  stop_loss: string;
  take_profit: string[];
  current_price: string;
}

export interface TradeRiskDto {
  account_risk_pct: string;
  position_size_lots: string;
  reward_to_risk: string;
  max_loss: string;
  max_gain: string;
}

export interface TradeContextDto {
  session: SessionNameDto;
  mode: TradeModeDto;
  narrative: string;
  macro_tags: string[];
  confidence: number;
}

export interface TradeTimelineEventDto {
  id: string;
  at: string;
  kind: string;
  summary: string;
  detail?: string | null;
}

export interface TradeAutopsyDto {
  summary: string;
  lessons: string[];
  rating: number;
}

export interface TradeListItemDto {
  id: string;
  symbol: "XAUUSD";
  side: TradeSideDto;
  status: TradeStatusDto;
  engine: EngineTierDto;
  score: number;
  levels: TradeLevelsDto;
  risk: TradeRiskDto;
  context: TradeContextDto;
  logic_version: string;
  candidate_status: CandidateStatusDto;
  created_at: string;
  updated_at: string;
}

export interface TradeDetailDto extends TradeListItemDto {
  timeline: TradeTimelineEventDto[];
  autopsy?: TradeAutopsyDto | null;
  execution?: ExecutionStatusDto | null;
}

export type ExecutionPhaseDto =
  | "queued"
  | "routing"
  | "pending_fill"
  | "filled"
  | "rejected"
  | "cancelled";

export interface ExecutionStatusDto {
  trade_id: string;
  phase: ExecutionPhaseDto;
  broker_ticket?: string | null;
  filled_price?: string | null;
  filled_at?: string | null;
  slippage?: string | null;
  attempt: number;
  last_checked_at: string;
  rejection_code?: string | null;
  rejection_message?: string | null;
}

export interface TradeListResponseDto {
  trades: TradeListItemDto[];
  next_cursor?: string | null;
}

export interface TradeApproveRequestDto {
  intent_token: string;
  note?: string;
}

export interface TradeExecuteRequestDto {
  intent_token: string;
  override_lots?: string;
}
