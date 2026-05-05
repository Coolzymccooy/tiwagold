import type { AnalyticsSummary } from "@/types/analytics";
import { COPY } from "@/content/copy";
import type {
  AnalyticsKpi,
  AnalyticsView,
  EngineRow,
  EquitySparkline,
  ModeRow,
  SessionRow,
} from "./types";

const ENGINE_LABELS: Record<string, string> = {
  conservative: "Conservative",
  aggressive: "Aggressive",
};

const SESSION_LABELS: Record<string, string> = {
  asian: "Asian",
  london: "London",
  new_york: "New York",
  off_hours: "Off hours",
};

const MODE_LABELS: Record<string, string> = {
  conservative: "Conservative",
  aggressive: "Aggressive",
};

function formatR(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toFixed(2)}R`;
}

function formatPct(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

function formatInt(value: number): string {
  return Math.trunc(value).toString();
}

function toneForR(value: number): AnalyticsKpi["tone"] {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

function buildKpis(summary: AnalyticsSummary): AnalyticsKpi[] {
  const labels = COPY.analytics.kpis;
  const streakTone: AnalyticsKpi["tone"] =
    summary.streak.count === 0
      ? "neutral"
      : summary.streak.kind === "win"
        ? "positive"
        : "negative";
  const streakValue =
    summary.streak.count === 0
      ? "—"
      : `${summary.streak.count} ${summary.streak.kind}`;
  return [
    {
      id: "totalR",
      label: labels.totalR,
      value: formatR(summary.totalR),
      tone: toneForR(summary.totalR),
      emphasis: "hero",
    },
    {
      id: "winRate",
      label: labels.winRate,
      value: formatPct(summary.winRate),
      tone: summary.winRate >= 0.5 ? "positive" : "negative",
      emphasis: "hero",
    },
    {
      id: "activeTrades",
      label: labels.activeTrades,
      value: formatInt(summary.activeTrades),
      tone: "neutral",
    },
    {
      id: "closedTrades",
      label: labels.closedTrades,
      value: formatInt(summary.closedTrades),
      tone: "neutral",
    },
    {
      id: "avgR",
      label: labels.avgR,
      value: formatR(summary.avgR),
      tone: toneForR(summary.avgR),
    },
    {
      id: "expectancy",
      label: labels.expectancy,
      value: formatR(summary.expectancy),
      tone: toneForR(summary.expectancy),
    },
    {
      id: "bestTrade",
      label: labels.bestTrade,
      value: formatR(summary.bestTradeR),
      tone: toneForR(summary.bestTradeR),
    },
    {
      id: "worstTrade",
      label: labels.worstTrade,
      value: formatR(summary.worstTradeR),
      tone: toneForR(summary.worstTradeR),
    },
    {
      id: "totalTrades",
      label: labels.totalTrades,
      value: formatInt(summary.totalTrades),
      tone: "neutral",
    },
    {
      id: "streak",
      label: labels.streak,
      value: streakValue,
      tone: streakTone,
    },
  ];
}

function buildEngines(summary: AnalyticsSummary): EngineRow[] {
  return summary.byEngine.map((breakdown) => ({
    breakdown,
    engineLabel: ENGINE_LABELS[breakdown.engine] ?? breakdown.engine,
    tradesLabel: `${formatInt(breakdown.trades)} trades`,
    winRateLabel: formatPct(breakdown.winRate),
    avgRLabel: formatR(breakdown.avgR),
  }));
}

function buildSessions(summary: AnalyticsSummary): SessionRow[] {
  return summary.bySession.map((breakdown) => ({
    breakdown,
    sessionLabel: SESSION_LABELS[breakdown.session] ?? breakdown.session,
    tradesLabel: `${formatInt(breakdown.trades)} trades`,
    winRateLabel: formatPct(breakdown.winRate),
    avgRLabel: formatR(breakdown.avgR),
  }));
}

function buildModes(summary: AnalyticsSummary): ModeRow[] {
  return summary.byMode.map((breakdown) => ({
    breakdown,
    modeLabel: MODE_LABELS[breakdown.mode] ?? breakdown.mode,
    tradesLabel: `${formatInt(breakdown.trades)} trades`,
    winRateLabel: formatPct(breakdown.winRate),
    avgRLabel: formatR(breakdown.avgR),
  }));
}

function buildEquity(summary: AnalyticsSummary): EquitySparkline {
  const points = summary.equityCurve;
  if (points.length === 0) {
    return { points, min: 0, max: 0, latest: null, changeR: 0 };
  }
  const equities = points.map((p) => p.equity);
  const first = points[0];
  const last = points[points.length - 1];
  return {
    points,
    min: Math.min(...equities),
    max: Math.max(...equities),
    latest: last ?? null,
    changeR: (last?.rRunning ?? 0) - (first?.rRunning ?? 0),
  };
}

export function toAnalyticsView(
  summary: AnalyticsSummary | undefined,
): AnalyticsView | undefined {
  if (!summary) return undefined;
  return {
    summary,
    kpis: buildKpis(summary),
    engines: buildEngines(summary),
    sessions: buildSessions(summary),
    modes: buildModes(summary),
    equity: buildEquity(summary),
    hasData: summary.totalTrades > 0,
  };
}
