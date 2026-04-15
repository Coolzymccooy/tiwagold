import type { AnalyticsSummary, EquityPoint } from "@/types/analytics";

const equityCurve: EquityPoint[] = [
  { at: "2026-03-14", equity: 25_000, rRunning: 0 },
  { at: "2026-03-18", equity: 25_320, rRunning: 1.3 },
  { at: "2026-03-22", equity: 25_280, rRunning: 1.1 },
  { at: "2026-03-26", equity: 25_560, rRunning: 2.2 },
  { at: "2026-03-30", equity: 25_840, rRunning: 3.4 },
  { at: "2026-04-03", equity: 25_720, rRunning: 2.9 },
  { at: "2026-04-07", equity: 26_180, rRunning: 4.7 },
  { at: "2026-04-11", equity: 26_420, rRunning: 5.7 },
  { at: "2026-04-14", equity: 26_520, rRunning: 6.1 },
];

export const MOCK_ANALYTICS: AnalyticsSummary = {
  range: "30d",
  totalTrades: 18,
  winRate: 0.61,
  avgR: 0.42,
  totalR: 6.1,
  bestTradeR: 3.0,
  worstTradeR: -1.1,
  expectancy: 0.38,
  equityCurve,
  byEngine: [
    { engine: "conservative", trades: 9, winRate: 0.67, avgR: 0.52 },
    { engine: "aggressive", trades: 6, winRate: 0.5, avgR: 0.31 },
    { engine: "sniper", trades: 3, winRate: 0.67, avgR: 0.48 },
  ],
  bySession: [
    { session: "london", trades: 7, winRate: 0.71, avgR: 0.58 },
    { session: "new_york", trades: 8, winRate: 0.5, avgR: 0.28 },
    { session: "asian", trades: 3, winRate: 0.67, avgR: 0.47 },
    { session: "off_hours", trades: 0, winRate: 0, avgR: 0 },
  ],
  byMode: [
    { mode: "conservative", trades: 11, winRate: 0.64, avgR: 0.46 },
    { mode: "aggressive", trades: 7, winRate: 0.57, avgR: 0.35 },
  ],
  streak: { kind: "win", count: 3 },
};
