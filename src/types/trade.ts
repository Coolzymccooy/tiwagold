export const TRADE_SYMBOL = "XAU/USD" as const;
export type TradeSymbol = typeof TRADE_SYMBOL;

export type TradeState =
  | "REJECTED"
  | "WAIT"
  | "VALID"
  | "TRIGGERED"
  | "CLOSED";

export type TradeDirection = "BUY" | "SELL";
export type TradeOrderType = "LIMIT" | "MARKET";
export type TradeMode = "conservative" | "aggressive";
export type SessionName = "london" | "new_york" | "asian" | "off_hours";
export type Volatility = "low" | "normal" | "high";
export type StructureBias = "bullish" | "bearish" | "neutral";
export type EngineTier = "conservative" | "aggressive";

export interface IndicatorSnapshot {
  rsi14: number;
  macdHistogram: number;
  ema20: number;
  ema50: number;
  ema200: number;
  atr14: number;
}

export interface OrderBlock {
  direction: "bullish" | "bearish";
  low: number;
  high: number;
  tested?: boolean;
}

export interface FairValueGap {
  direction: "bullish" | "bearish";
  low: number;
  high: number;
  filled?: boolean;
}

export interface StructureSnapshot {
  htfTrend: StructureBias;
  ltfStructure: StructureBias;
  structureLabel?: string;
  liquiditySwept?: boolean;
  liquidityLevel?: number;
  orderBlock?: OrderBlock;
  fvg?: FairValueGap;
}

export interface PriceRange {
  high: number;
  low: number;
}

export interface MarketSnapshot {
  symbol: TradeSymbol;
  timestamp: string;
  price: number;
  session: SessionName;
  volatility: Volatility;
  indicators: IndicatorSnapshot;
  structure: StructureSnapshot;
  recentRange: PriceRange;
  support?: number;
  resistance?: number;
}

export interface TradeSetup {
  direction: TradeDirection;
  entry: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  rr: number;
  riskPercent: number;
  orderType: TradeOrderType;
  invalidation: string;
  expiry: string;
  setupType: string;
}

export interface EvaluationResult {
  state: TradeState;
  symbol: TradeSymbol;
  price: number;
  session: SessionName;
  setupScore?: number;
  reason: string[];
  action?: string[];
  context?: string[];
  indicatorNotes?: string[];
  setup?: TradeSetup;
  mode?: TradeMode;
}

export type CandidateStatus =
  | "created"
  | "approved"
  | "risk_blocked"
  | "executed"
  | "expired"
  | "cancelled";

export type TradeOrderRouting = "MARKET" | "LIMIT";

export interface TradeCandidate {
  id: string;
  dedupeKey: string;
  symbol: TradeSymbol;
  direction: TradeDirection;
  mode: TradeMode;
  engineTier: EngineTier;
  strategyTag: string;
  setupType: string;
  sessionTag: SessionName;
  score: number;
  proposedEntry: number;
  stopLoss: number;
  tp1: number;
  tp2?: number;
  riskReward: number;
  riskPercent?: number;
  orderRouting?: TradeOrderRouting;
  htfTrend: string;
  ltfStructure: string;
  confluenceTags: string[];
  thesisSummary?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  status: CandidateStatus;
  brokerTicket?: string | null;
  actualEntry?: number | null;
  currentPrice?: number;
  atr14?: number;
  spread?: number;
}

export interface TradeAutopsy {
  outcome: "win" | "loss" | "breakeven";
  exitPrice: number;
  exitReason: string;
  pnl: number;
  pnlR: number;
  durationMinutes: number;
  lessons: string[];
}

export interface TradeTimelineEvent {
  id: string;
  at: string;
  kind:
    | "created"
    | "approved"
    | "risk_blocked"
    | "triggered"
    | "tp1_hit"
    | "tp2_hit"
    | "stop_hit"
    | "expired"
    | "cancelled"
    | "note";
  summary: string;
  detail?: string;
}

export interface Trade extends TradeCandidate {
  timeline: TradeTimelineEvent[];
  autopsy?: TradeAutopsy;
  currentPnlR?: number;
  currentPnlUsd?: number;
}

export type ExecutionPhase =
  | "queued"
  | "routing"
  | "pending_fill"
  | "filled"
  | "rejected"
  | "cancelled";

export interface ExecutionStatus {
  tradeId: string;
  phase: ExecutionPhase;
  brokerTicket?: string | null;
  filledPrice?: number;
  filledAt?: string;
  slippage?: number;
  attempt: number;
  lastCheckedAt: string;
  rejectionCode?: string;
  rejectionMessage?: string;
}

export interface RiskSettings {
  minRR: number;
  maxRiskPercent: number;
  allowedSessions: SessionName[];
  maxDataAgeMinutes: number;
  maxDailyDrawdownPct: number;
  maxOpenPositions: number;
  cooldownAfterLossMinutes: number;
}

export const defaultRiskSettings: RiskSettings = {
  minRR: 2,
  maxRiskPercent: 1,
  allowedSessions: ["london", "new_york"],
  maxDataAgeMinutes: 10,
  maxDailyDrawdownPct: 3,
  maxOpenPositions: 2,
  cooldownAfterLossMinutes: 30,
};
