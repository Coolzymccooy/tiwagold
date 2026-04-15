import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { MOCK_ANALYTICS } from "@/mocks/analytics";
import type {
  AnalyticsEquitySeries,
  AnalyticsRange,
  AnalyticsSummary,
  EquityPoint,
} from "@/types/analytics";
import { simulateFetch } from "./client";

export const analyticsKeys = {
  summary: (range: AnalyticsRange) => ["analytics", "summary", range] as const,
  equity: (range: AnalyticsRange) => ["analytics", "equity", range] as const,
};

const RANGE_WINDOW_DAYS: Record<AnalyticsRange, number | null> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  ytd: null,
  all: null,
};

function parseDate(value: string): number {
  return new Date(value).getTime();
}

function yearStartMs(reference: number): number {
  const d = new Date(reference);
  return new Date(Date.UTC(d.getUTCFullYear(), 0, 1)).getTime();
}

function filterPointsByRange(
  points: EquityPoint[],
  range: AnalyticsRange,
): EquityPoint[] {
  if (points.length === 0) return [];
  const last = points[points.length - 1];
  if (!last) return [];
  const latestMs = parseDate(last.at);
  const windowDays = RANGE_WINDOW_DAYS[range];
  if (range === "all") return points.map((point) => ({ ...point }));
  if (range === "ytd") {
    const cutoff = yearStartMs(latestMs);
    return points
      .filter((point) => parseDate(point.at) >= cutoff)
      .map((point) => ({ ...point }));
  }
  if (windowDays === null) return points.map((point) => ({ ...point }));
  const cutoff = latestMs - windowDays * 24 * 60 * 60 * 1000;
  return points
    .filter((point) => parseDate(point.at) >= cutoff)
    .map((point) => ({ ...point }));
}

function computeEquitySeries(
  range: AnalyticsRange,
  points: EquityPoint[],
): AnalyticsEquitySeries {
  const filtered = filterPointsByRange(points, range);
  if (filtered.length === 0) {
    return {
      range,
      points: [],
      startingEquity: 0,
      endingEquity: 0,
      peakEquity: 0,
      maxDrawdownR: 0,
    };
  }
  const first = filtered[0];
  const last = filtered[filtered.length - 1];
  if (!first || !last) {
    return {
      range,
      points: [],
      startingEquity: 0,
      endingEquity: 0,
      peakEquity: 0,
      maxDrawdownR: 0,
    };
  }
  let peakEquity = first.equity;
  let peakR = first.rRunning;
  let maxDrawdownR = 0;
  for (const point of filtered) {
    if (point.equity > peakEquity) peakEquity = point.equity;
    if (point.rRunning > peakR) peakR = point.rRunning;
    const drawdown = peakR - point.rRunning;
    if (drawdown > maxDrawdownR) maxDrawdownR = drawdown;
  }
  return {
    range,
    points: filtered,
    startingEquity: first.equity,
    endingEquity: last.equity,
    peakEquity,
    maxDrawdownR: Number(maxDrawdownR.toFixed(2)),
  };
}

function scaleSummaryForRange(
  summary: AnalyticsSummary,
  range: AnalyticsRange,
): AnalyticsSummary {
  const filtered = filterPointsByRange(summary.equityCurve, range);
  if (
    range === "all" ||
    range === summary.range ||
    filtered.length === summary.equityCurve.length
  ) {
    return {
      ...summary,
      range,
      equityCurve: filtered,
    };
  }
  const ratio =
    summary.equityCurve.length > 0
      ? filtered.length / summary.equityCurve.length
      : 0;
  const scaledTrades = Math.max(1, Math.round(summary.totalTrades * ratio));
  const first = filtered[0];
  const last = filtered[filtered.length - 1];
  const totalR =
    first && last
      ? Number((last.rRunning - first.rRunning).toFixed(2))
      : 0;
  const avgR = scaledTrades > 0 ? Number((totalR / scaledTrades).toFixed(2)) : 0;
  return {
    ...summary,
    range,
    equityCurve: filtered,
    totalTrades: scaledTrades,
    totalR,
    avgR,
  };
}

export function useAnalyticsSummary(
  range: AnalyticsRange = "30d",
): UseQueryResult<AnalyticsSummary, Error> {
  return useQuery({
    queryKey: analyticsKeys.summary(range),
    queryFn: () =>
      simulateFetch<AnalyticsSummary>(() =>
        scaleSummaryForRange(MOCK_ANALYTICS, range),
      ),
    staleTime: 60_000,
  });
}

export function useAnalyticsEquity(
  range: AnalyticsRange = "30d",
): UseQueryResult<AnalyticsEquitySeries, Error> {
  return useQuery({
    queryKey: analyticsKeys.equity(range),
    queryFn: () =>
      simulateFetch<AnalyticsEquitySeries>(() =>
        computeEquitySeries(range, MOCK_ANALYTICS.equityCurve),
      ),
    staleTime: 60_000,
  });
}
