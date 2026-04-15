import type {
  AnalyticsEquitySeriesDto,
  AnalyticsSummaryDto,
  EngineBreakdownDto,
  EquityPointDto,
  ModeBreakdownDto,
  SessionBreakdownDto,
} from "@/types/dto";
import type {
  AnalyticsEquitySeries,
  AnalyticsSummary,
  EngineBreakdown,
  EquityPoint,
  ModeBreakdown,
  SessionBreakdown,
} from "@/types/analytics";

import { modeFromDto, sessionFromDto, toMoney } from "./primitives";

export function equityPointFromDto(dto: EquityPointDto): EquityPoint {
  return {
    at: dto.at,
    equity: toMoney(dto.equity),
    rRunning: toMoney(dto.r_running),
  };
}

export function engineBreakdownFromDto(
  dto: EngineBreakdownDto,
): EngineBreakdown {
  return {
    engine: dto.engine,
    trades: dto.trades,
    winRate: dto.win_rate,
    avgR: dto.avg_r,
  };
}

export function sessionBreakdownFromDto(
  dto: SessionBreakdownDto,
): SessionBreakdown {
  return {
    session: sessionFromDto(dto.session),
    trades: dto.trades,
    winRate: dto.win_rate,
    avgR: dto.avg_r,
  };
}

export function modeBreakdownFromDto(dto: ModeBreakdownDto): ModeBreakdown {
  return {
    mode: modeFromDto(dto.mode),
    trades: dto.trades,
    winRate: dto.win_rate,
    avgR: dto.avg_r,
  };
}

export function analyticsSummaryFromDto(
  dto: AnalyticsSummaryDto,
): AnalyticsSummary {
  return {
    range: dto.range,
    totalTrades: dto.total_trades,
    winRate: dto.win_rate,
    avgR: dto.avg_r,
    totalR: dto.total_r,
    bestTradeR: dto.best_trade_r,
    worstTradeR: dto.worst_trade_r,
    expectancy: dto.expectancy,
    equityCurve: dto.equity_curve.map(equityPointFromDto),
    byEngine: dto.by_engine.map(engineBreakdownFromDto),
    bySession: dto.by_session.map(sessionBreakdownFromDto),
    byMode: dto.by_mode.map(modeBreakdownFromDto),
    streak: { kind: dto.streak.kind, count: dto.streak.count },
  };
}

export function analyticsEquitySeriesFromDto(
  dto: AnalyticsEquitySeriesDto,
): AnalyticsEquitySeries {
  return {
    range: dto.range,
    points: dto.points.map(equityPointFromDto),
    startingEquity: toMoney(dto.starting_equity),
    endingEquity: toMoney(dto.ending_equity),
    peakEquity: toMoney(dto.peak_equity),
    maxDrawdownR: toMoney(dto.max_drawdown_r),
  };
}
