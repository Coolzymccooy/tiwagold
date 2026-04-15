import type { EngineTierDto, SessionNameDto, TradeModeDto } from "./trades";

export type AnalyticsRangeDto = "7d" | "30d" | "90d" | "ytd" | "all";

export interface AnalyticsBucketDto {
  label: string;
  trades: number;
  win_rate: number;
  avg_r: number;
  total_r: number;
}

export interface EquityPointDto {
  at: string;
  equity: string;
  r_running: string;
}

export interface EngineBreakdownDto {
  engine: EngineTierDto;
  trades: number;
  win_rate: number;
  avg_r: number;
}

export interface SessionBreakdownDto {
  session: SessionNameDto;
  trades: number;
  win_rate: number;
  avg_r: number;
}

export interface ModeBreakdownDto {
  mode: TradeModeDto;
  trades: number;
  win_rate: number;
  avg_r: number;
}

export interface AnalyticsSummaryDto {
  range: AnalyticsRangeDto;
  total_trades: number;
  win_rate: number;
  avg_r: number;
  total_r: number;
  best_trade_r: number;
  worst_trade_r: number;
  expectancy: number;
  equity_curve: EquityPointDto[];
  by_engine: EngineBreakdownDto[];
  by_session: SessionBreakdownDto[];
  by_mode: ModeBreakdownDto[];
  streak: { kind: "win" | "loss"; count: number };
}

export interface AnalyticsEquitySeriesDto {
  range: AnalyticsRangeDto;
  points: EquityPointDto[];
  starting_equity: string;
  ending_equity: string;
  peak_equity: string;
  max_drawdown_r: string;
}
