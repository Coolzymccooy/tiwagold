import {
  journalRowToTrade,
  journalToAnalyticsEquity,
  journalToAnalyticsSummary,
  journalToTrades,
} from "@/mappers/journal";
import { parseJournalDto, type JournalDto } from "@/types/dto/journal";
import { TRADE_SYMBOL } from "@/types/trade";

const T0 = "2026-04-01T08:00:00.000Z";
const T_CLOSE = "2026-04-01T11:00:00.000Z";

function fixture(): JournalDto {
  return {
    stats: { totalTrades: 3, winRate: 66, totalR: 2.5 },
    openTrades: 1,
    trades: [
      {
        id: "trd_001",
        direction: "BUY",
        setupType: "smc_pullback",
        state: "CLOSED",
        session: "london",
        entry: 2400,
        stopLoss: 2390,
        tp1: 2420,
        tp2: 2435,
        rr: 2,
        setupScore: 88,
        result: "WIN",
        rMultiple: 1.8,
        createdAt: T0,
        closedAt: T_CLOSE,
      },
      {
        id: "trd_002",
        direction: "SELL",
        setupType: "aggressive_breakout",
        state: "CLOSED",
        session: "new_york",
        entry: 2420,
        stopLoss: 2430,
        tp1: 2400,
        tp2: 2390,
        rr: 2,
        setupScore: 72,
        result: "LOSS",
        rMultiple: -1,
        createdAt: T0,
        closedAt: T_CLOSE,
      },
      {
        id: "trd_003",
        direction: "BUY",
        setupType: "smc_pullback",
        state: "VALID",
        session: "asia",
        entry: 2410,
        stopLoss: 2402,
        tp1: 2425,
        tp2: 2435,
        rr: 1.875,
        setupScore: 60,
        result: null,
        rMultiple: null,
        createdAt: T0,
        closedAt: null,
      },
    ],
    equityCurve: [
      { date: "2026-04-01T00:00:00.000Z", r: 0 },
      { date: "2026-04-02T00:00:00.000Z", r: 1.8 },
      { date: "2026-04-03T00:00:00.000Z", r: 0.8 },
      { date: "2026-04-04T00:00:00.000Z", r: 2.6 },
    ],
    sessionBreakdown: {
      london: { wins: 1, losses: 0, total: 1 },
      new_york: { wins: 0, losses: 1, total: 1 },
    },
    setupBreakdown: {
      smc_pullback: { wins: 1, losses: 0, total: 1, avgR: 1.8 },
      aggressive_breakout: { wins: 0, losses: 1, total: 1, avgR: -1 },
    },
    ruleBreaks: 0,
  };
}

describe("parseJournalDto", () => {
  test("accepts the canonical journal payload", () => {
    expect(() => parseJournalDto(fixture())).not.toThrow();
  });

  test("rejects payloads missing required arrays", () => {
    expect(() => parseJournalDto({ stats: {}, trades: null, openTrades: 0 })).toThrow();
  });
});

describe("journalRowToTrade", () => {
  test("synthesises Trade with XAU/USD symbol and inferred engine tier", () => {
    const row = fixture().trades[0]!;
    const trade = journalRowToTrade(row);
    expect(trade.symbol).toBe(TRADE_SYMBOL);
    expect(trade.engineTier).toBe("conservative");
    expect(trade.proposedEntry).toBe(2400);
    expect(trade.score).toBe(88);
    expect(trade.status).toBe("executed");
    expect(trade.timeline.length).toBeGreaterThanOrEqual(2);
    expect(trade.autopsy?.outcome).toBe("win");
    expect(trade.autopsy?.pnlR).toBeCloseTo(1.8, 2);
  });

  test("infers aggressive engine tier from setupType", () => {
    const row = fixture().trades[1]!;
    const trade = journalRowToTrade(row);
    expect(trade.engineTier).toBe("aggressive");
    expect(trade.mode).toBe("aggressive");
    expect(trade.autopsy?.outcome).toBe("loss");
  });

  test("maps unknown sessions to off_hours", () => {
    const row = fixture().trades[2]!;
    const trade = journalRowToTrade(row);
    expect(trade.sessionTag).toBe("asian");
    expect(trade.status).toBe("created");
    expect(trade.autopsy).toBeUndefined();
  });

  test("prefers explicit mode='aggressive' from cloud over substring inference", () => {
    // setupType has no 'aggressive' or 'breakout' substring (matches the
    // real-world setup names like smc_continuation), so the inference
    // would say 'conservative'. The explicit `mode` field must win.
    const row = {
      ...fixture().trades[0]!,
      setupType: "smc_continuation",
      mode: "aggressive" as const,
    };
    const trade = journalRowToTrade(row);
    expect(trade.engineTier).toBe("aggressive");
    expect(trade.mode).toBe("aggressive");
  });

  test("explicit mode='conservative' overrides setupType containing 'aggressive'", () => {
    // Inverse case: even if setupType happens to include 'aggressive',
    // an explicit conservative mode from the cloud is authoritative.
    const row = {
      ...fixture().trades[0]!,
      setupType: "aggressive_breakout",
      mode: "conservative" as const,
    };
    const trade = journalRowToTrade(row);
    expect(trade.engineTier).toBe("conservative");
    expect(trade.mode).toBe("conservative");
  });

  test("falls back to inferEngineTier when mode is missing (legacy / older deploy)", () => {
    const row = {
      ...fixture().trades[0]!,
      setupType: "aggressive_continuation",
      mode: undefined,
    };
    const trade = journalRowToTrade(row);
    expect(trade.engineTier).toBe("aggressive");
    expect(trade.mode).toBe("aggressive");
  });

  test("falls back to inferEngineTier when mode is null (transitional shape)", () => {
    // During a rolling deploy a row may surface mode=null instead of
    // omitting the field. The schema accepts it (`.nullish()`) and the
    // mapper falls back to setupType inference.
    const row = {
      ...fixture().trades[0]!,
      setupType: "aggressive_continuation",
      mode: null,
    };
    const trade = journalRowToTrade(row);
    expect(trade.engineTier).toBe("aggressive");
    expect(trade.mode).toBe("aggressive");
  });
});

describe("parseJournalDto — mode field tolerance", () => {
  test("accepts mode: null on individual rows without rejecting the whole payload", () => {
    // Regression for codex P1: legacy/transitional rows with mode=null
    // must not blow up parseJournalDto for the entire journal response.
    const payload = fixture();
    const rowWithNull = {
      ...payload.trades[0]!,
      mode: null as null,
    };
    const result = parseJournalDto({
      ...payload,
      trades: [rowWithNull, ...payload.trades.slice(1)],
    });
    expect(result.trades).toHaveLength(payload.trades.length);
    expect(result.trades[0]?.mode ?? null).toBeNull();
  });

  test("accepts mode field omitted entirely", () => {
    const payload = fixture();
    const { mode: _drop, ...rowWithoutMode } = {
      ...payload.trades[0]!,
      mode: undefined,
    };
    void _drop;
    const result = parseJournalDto({
      ...payload,
      trades: [rowWithoutMode, ...payload.trades.slice(1)],
    });
    expect(result.trades).toHaveLength(payload.trades.length);
  });

  test("accepts cloud mode values outside the conservative/aggressive enum (e.g. manual_import)", () => {
    // Regression for the live journal failure: rows with mode=manual_import
    // (broker-history imports) used to fail the whole zod parse, which broke
    // the Trades + Analytics tabs. Schema is now z.string().nullish() and
    // unknown values fall through to setupType-based inference in
    // resolveMode/resolveEngineTier downstream.
    const payload = fixture();
    const rowWithImport = {
      ...payload.trades[0]!,
      mode: "manual_import" as unknown as "aggressive",
    };
    const result = parseJournalDto({
      ...payload,
      trades: [rowWithImport, ...payload.trades.slice(1)],
    });
    expect(result.trades).toHaveLength(payload.trades.length);
    expect(result.trades[0]?.mode).toBe("manual_import");
  });
});

describe("journalToTrades", () => {
  test("maps every row in the journal", () => {
    const trades = journalToTrades(fixture());
    expect(trades).toHaveLength(3);
    expect(trades.map((t) => t.id)).toEqual(["trd_001", "trd_002", "trd_003"]);
  });
});

describe("journalToAnalyticsSummary", () => {
  test("computes win rate, totals, and breakdowns from closed trades", () => {
    const summary = journalToAnalyticsSummary(fixture(), "all");
    expect(summary.totalTrades).toBe(3);
    expect(summary.activeTrades).toBe(1);
    expect(summary.closedTrades).toBe(2);
    expect(summary.winRate).toBe(50);
    expect(summary.totalR).toBeCloseTo(0.8, 2);
    expect(summary.bestTradeR).toBe(1.8);
    expect(summary.worstTradeR).toBe(-1);
    expect(summary.byEngine).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ engine: "conservative", trades: 1, winRate: 100 }),
        expect.objectContaining({ engine: "aggressive", trades: 1, winRate: 0 }),
      ]),
    );
    expect(summary.bySession).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ session: "london", trades: 1, winRate: 100 }),
        expect.objectContaining({ session: "new_york", trades: 1, winRate: 0 }),
      ]),
    );
  });

  test("derives a most-recent streak", () => {
    const summary = journalToAnalyticsSummary(fixture(), "all");
    expect(summary.streak.count).toBeGreaterThanOrEqual(1);
  });
});

describe("journalToAnalyticsEquity", () => {
  test("filters to range and computes peak + drawdown", () => {
    const series = journalToAnalyticsEquity(fixture(), "all");
    expect(series.points).toHaveLength(4);
    expect(series.startingEquity).toBeCloseTo(10_000, 2);
    expect(series.endingEquity).toBeCloseTo(10_002.6, 2);
    expect(series.peakEquity).toBeCloseTo(10_002.6, 2);
    expect(series.maxDrawdownR).toBeCloseTo(1, 2);
  });

  test("returns empty when no points", () => {
    const dto = fixture();
    const empty = { ...dto, equityCurve: [] };
    const series = journalToAnalyticsEquity(empty, "30d");
    expect(series.points).toEqual([]);
    expect(series.startingEquity).toBe(0);
  });
});
