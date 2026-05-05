import type {
  Trade,
  TradeTimelineEvent,
  TradeAutopsy,
} from "@/types/trade";
import { TRADE_SYMBOL } from "@/types/trade";

const minute = 60_000;
const hour = 60 * minute;

const now = () => new Date();
const offset = (ms: number) => new Date(Date.now() + ms).toISOString();
const hourKey = (iso: string) => iso.slice(0, 13);

const buildDedupeKey = (
  direction: "BUY" | "SELL",
  setupType: string,
  session: string,
  iso: string,
) => `${TRADE_SYMBOL}_${direction}_${setupType}_${session}_${hourKey(iso)}`;

const createdAt1 = offset(-30 * minute);
const createdAt2 = offset(-2 * hour);
const createdAt3 = now().toISOString();
const createdAt4 = offset(-5 * minute);

const trd1Timeline: TradeTimelineEvent[] = [
  {
    id: "trd_1_evt_created",
    at: createdAt1,
    kind: "created",
    summary: "Setup detected on NY open pullback",
    detail: "15m FVG + bullish OB confluence above 2340 swing low.",
  },
  {
    id: "trd_1_evt_approved",
    at: offset(-28 * minute),
    kind: "approved",
    summary: "Risk gate passed — 1R = 10.50 pts",
  },
  {
    id: "trd_1_evt_triggered",
    at: offset(-24 * minute),
    kind: "triggered",
    summary: "Market entry filled at 2345.50",
  },
];

const trd2Autopsy: TradeAutopsy = {
  outcome: "win",
  exitPrice: 2365.0,
  exitReason: "TP1 hit on London open volume spike",
  pnl: 50.0,
  pnlR: 3.0,
  durationMinutes: 92,
  lessons: [
    "Asian consolidation read was clean — range support held, reversal was textbook.",
    "Entering on momentum divergence paid off; tighter stop would have improved R.",
  ],
};

const trd2Timeline: TradeTimelineEvent[] = [
  {
    id: "trd_2_evt_created",
    at: createdAt2,
    kind: "created",
    summary: "Short setup at weekly supply",
    detail: "Double top on 1H, MACD bearish divergence, volume rejection candle.",
  },
  {
    id: "trd_2_evt_approved",
    at: offset(-2 * hour + 4 * minute),
    kind: "approved",
    summary: "Aggressive engine approved 2.5% risk",
  },
  {
    id: "trd_2_evt_triggered",
    at: offset(-2 * hour + 6 * minute),
    kind: "triggered",
    summary: "Market fill at 2380.00",
  },
  {
    id: "trd_2_evt_tp1",
    at: offset(-2 * hour + 92 * minute),
    kind: "tp1_hit",
    summary: "TP1 tagged at 2365.00",
    detail: "Exited full size per plan.",
  },
];

const trd3Timeline: TradeTimelineEvent[] = [
  {
    id: "trd_3_evt_created",
    at: createdAt3,
    kind: "created",
    summary: "High-conviction setup detected in Asian range",
    detail: "Accumulation schematic complete, awaiting break of range high.",
  },
];

const trd4Timeline: TradeTimelineEvent[] = [
  {
    id: "trd_4_evt_created",
    at: createdAt4,
    kind: "created",
    summary: "Short limit setup at daily resistance",
    detail: "1H bearish engulfing, high-impact news catalyst ahead.",
  },
];

export const MOCK_TRADES: Trade[] = [
  {
    id: "trd_1",
    dedupeKey: buildDedupeKey("BUY", "fvg_pullback", "new_york", createdAt1),
    symbol: TRADE_SYMBOL,
    direction: "BUY",
    mode: "conservative",
    engineTier: "conservative",
    strategyTag: "ny_open_pullback",
    setupType: "fvg_pullback",
    sessionTag: "new_york",
    score: 88,
    proposedEntry: 2345.5,
    stopLoss: 2335.0,
    tp1: 2360.0,
    tp2: 2372.5,
    riskReward: 2.38,
    riskPercent: 1.0,
    orderRouting: "MARKET",
    htfTrend: "Bullish macro structure — rising 200 EMA on daily",
    ltfStructure: "Pullback into 15m bullish FVG, respected OB",
    confluenceTags: ["fvg", "order_block", "rsi_oversold", "ema_crossover"],
    thesisSummary:
      "Clean NY open continuation long — price bounced off 2340 confluence zone with 9/21 EMA bullish crossover.",
    expiresAt: offset(8 * hour),
    createdAt: createdAt1,
    updatedAt: offset(-24 * minute),
    status: "executed",
    actualEntry: 2345.5,
    currentPrice: 2350.2,
    atr14: 8.4,
    spread: 0.25,
    timeline: trd1Timeline,
    currentPnlR: 0.45,
    currentPnlUsd: 67.76,
  },
  {
    id: "trd_2",
    dedupeKey: buildDedupeKey("SELL", "double_top", "london", createdAt2),
    symbol: TRADE_SYMBOL,
    direction: "SELL",
    mode: "aggressive",
    engineTier: "aggressive",
    strategyTag: "weekly_supply_rejection",
    setupType: "double_top",
    sessionTag: "london",
    score: 78,
    proposedEntry: 2380.0,
    stopLoss: 2385.0,
    tp1: 2365.0,
    tp2: 2355.0,
    riskReward: 3.0,
    riskPercent: 2.5,
    orderRouting: "MARKET",
    htfTrend: "Approaching weekly supply zone",
    ltfStructure: "Double top + MACD bearish divergence + volume rejection",
    confluenceTags: ["double_top", "macd_divergence", "volume_spike", "weekly_supply"],
    thesisSummary:
      "London reversal short — weekly supply holding, momentum divergence confirming exhaustion.",
    expiresAt: offset(-30 * minute),
    createdAt: createdAt2,
    updatedAt: offset(-2 * hour + 92 * minute),
    status: "executed",
    actualEntry: 2380.0,
    currentPrice: 2365.0,
    atr14: 9.1,
    spread: 0.3,
    timeline: trd2Timeline,
    autopsy: trd2Autopsy,
    currentPnlR: 3.0,
    currentPnlUsd: 50.0,
  },
  {
    id: "trd_3",
    dedupeKey: buildDedupeKey("BUY", "range_breakout", "asian", createdAt3),
    symbol: TRADE_SYMBOL,
    direction: "BUY",
    mode: "aggressive",
    engineTier: "aggressive",
    strategyTag: "asian_range_breakout",
    setupType: "range_breakout",
    sessionTag: "asian",
    score: 95,
    proposedEntry: 2320.0,
    stopLoss: 2310.0,
    tp1: 2340.0,
    tp2: 2352.0,
    riskReward: 2.0,
    riskPercent: 1.5,
    orderRouting: "LIMIT",
    htfTrend: "Bullish trend continuation on 4H",
    ltfStructure: "Accumulation phase complete, coiled range compression",
    confluenceTags: [
      "range_breakout",
      "accumulation",
      "momentum_4h",
      "high_conviction",
    ],
    thesisSummary:
      "High-conviction setup — accumulation complete, awaiting range-high break to trigger long.",
    expiresAt: offset(4 * hour),
    createdAt: createdAt3,
    updatedAt: createdAt3,
    status: "created",
    currentPrice: 2320.0,
    atr14: 6.8,
    spread: 0.25,
    timeline: trd3Timeline,
  },
  {
    id: "trd_4",
    dedupeKey: buildDedupeKey("SELL", "daily_rejection", "new_york", createdAt4),
    symbol: TRADE_SYMBOL,
    direction: "SELL",
    mode: "conservative",
    engineTier: "conservative",
    strategyTag: "daily_resistance_fade",
    setupType: "daily_rejection",
    sessionTag: "new_york",
    score: 82,
    proposedEntry: 2395.0,
    stopLoss: 2405.0,
    tp1: 2370.0,
    tp2: 2355.0,
    riskReward: 2.5,
    riskPercent: 1.0,
    orderRouting: "LIMIT",
    htfTrend: "Bearish order flow into daily resistance",
    ltfStructure: "1H bearish engulfing + distribution schematic",
    confluenceTags: [
      "daily_resistance",
      "engulfing",
      "distribution",
      "news_catalyst",
    ],
    thesisSummary:
      "NY fade short at daily resistance — distribution playing out into high-impact news window.",
    expiresAt: offset(2 * hour),
    createdAt: createdAt4,
    updatedAt: createdAt4,
    status: "created",
    currentPrice: 2395.0,
    atr14: 7.6,
    spread: 0.28,
    timeline: trd4Timeline,
  },
];

export const findMockTrade = (id: string): Trade | undefined =>
  MOCK_TRADES.find((t) => t.id === id);
