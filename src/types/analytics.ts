import type { EngineTier, SessionName, TradeMode } from "./trade";

export type AnalyticsRange = "7d" | "30d" | "90d" | "ytd" | "all";

export interface PerformanceBucket {
  label: string;
  trades: number;
  winRate: number;
  avgR: number;
  totalR: number;
}

export interface EquityPoint {
  at: string;
  equity: number;
  rRunning: number;
}

export interface EngineBreakdown {
  engine: EngineTier;
  trades: number;
  winRate: number;
  avgR: number;
}

export interface SessionBreakdown {
  session: SessionName;
  trades: number;
  winRate: number;
  avgR: number;
}

export interface ModeBreakdown {
  mode: TradeMode;
  trades: number;
  winRate: number;
  avgR: number;
}

export interface AnalyticsSummary {
  range: AnalyticsRange;
  totalTrades: number;
  activeTrades: number;
  closedTrades: number;
  winRate: number;
  avgR: number;
  totalR: number;
  bestTradeR: number;
  worstTradeR: number;
  expectancy: number;
  equityCurve: EquityPoint[];
  byEngine: EngineBreakdown[];
  bySession: SessionBreakdown[];
  byMode: ModeBreakdown[];
  streak: { kind: "win" | "loss"; count: number };
}

export interface AnalyticsEquitySeries {
  range: AnalyticsRange;
  points: EquityPoint[];
  startingEquity: number;
  endingEquity: number;
  peakEquity: number;
  maxDrawdownR: number;
}
