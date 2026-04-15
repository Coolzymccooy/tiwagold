import type {
  AnalyticsSummary,
  EngineBreakdown,
  EquityPoint,
  ModeBreakdown,
  SessionBreakdown,
} from "@/types/analytics";

export type AnalyticsKpiId =
  | "totalTrades"
  | "activeTrades"
  | "closedTrades"
  | "winRate"
  | "avgR"
  | "totalR"
  | "bestTrade"
  | "worstTrade"
  | "expectancy"
  | "streak";

export interface AnalyticsKpi {
  id: AnalyticsKpiId;
  label: string;
  value: string;
  tone: "neutral" | "positive" | "negative";
  emphasis?: "hero" | "default";
}

export interface EngineRow {
  breakdown: EngineBreakdown;
  engineLabel: string;
  tradesLabel: string;
  winRateLabel: string;
  avgRLabel: string;
}

export interface SessionRow {
  breakdown: SessionBreakdown;
  sessionLabel: string;
  tradesLabel: string;
  winRateLabel: string;
  avgRLabel: string;
}

export interface ModeRow {
  breakdown: ModeBreakdown;
  modeLabel: string;
  tradesLabel: string;
  winRateLabel: string;
  avgRLabel: string;
}

export interface EquitySparkline {
  points: EquityPoint[];
  min: number;
  max: number;
  latest: EquityPoint | null;
  changeR: number;
}

export interface AnalyticsView {
  summary: AnalyticsSummary;
  kpis: AnalyticsKpi[];
  engines: EngineRow[];
  sessions: SessionRow[];
  modes: ModeRow[];
  equity: EquitySparkline;
  hasData: boolean;
}
