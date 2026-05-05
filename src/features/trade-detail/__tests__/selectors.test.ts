import type { Trade, TradeAutopsy, TradeTimelineEvent } from "@/types/trade";

import {
  buildLevels,
  buildTimeline,
  riskRewardMultiple,
  stopDistance,
  toTradeDetailView,
  tp1Distance,
  tp2Distance,
} from "../selectors";

function makeTrade(overrides: Partial<Trade> = {}): Trade {
  const base: Trade = {
    id: "trd_base",
    dedupeKey: "XAU/USD_BUY_fvg_new_york_2026-04-14T10",
    symbol: "XAU/USD",
    direction: "BUY",
    mode: "conservative",
    engineTier: "conservative",
    strategyTag: "ny_open_pullback",
    setupType: "fvg_pullback",
    sessionTag: "new_york",
    score: 80,
    proposedEntry: 2345.5,
    stopLoss: 2335.0,
    tp1: 2360.0,
    riskReward: 2,
    htfTrend: "bullish",
    ltfStructure: "bullish",
    confluenceTags: [],
    expiresAt: "2026-04-14T18:00:00.000Z",
    createdAt: "2026-04-14T09:00:00.000Z",
    updatedAt: "2026-04-14T09:00:00.000Z",
    status: "created",
    timeline: [],
  };
  return { ...base, ...overrides };
}

function makeEvent(
  at: string,
  kind: TradeTimelineEvent["kind"] = "created",
  overrides: Partial<TradeTimelineEvent> = {},
): TradeTimelineEvent {
  return {
    id: `evt_${kind}_${at}`,
    at,
    kind,
    summary: `event ${kind} at ${at}`,
    ...overrides,
  };
}

describe("trade-detail selectors — distance helpers", () => {
  it("stopDistance returns absolute distance for BUY direction", () => {
    const trade = makeTrade({
      direction: "BUY",
      proposedEntry: 2345.5,
      stopLoss: 2335.0,
    });
    expect(stopDistance(trade)).toBeCloseTo(10.5);
  });

  it("stopDistance returns absolute distance for SELL direction", () => {
    const trade = makeTrade({
      direction: "SELL",
      proposedEntry: 2345.5,
      stopLoss: 2356.0,
    });
    expect(stopDistance(trade)).toBeCloseTo(10.5);
  });

  it("tp1Distance returns absolute distance for BUY direction", () => {
    const trade = makeTrade({
      direction: "BUY",
      proposedEntry: 2345.5,
      tp1: 2360.0,
    });
    expect(tp1Distance(trade)).toBeCloseTo(14.5);
  });

  it("tp1Distance returns absolute distance for SELL direction", () => {
    const trade = makeTrade({
      direction: "SELL",
      proposedEntry: 2345.5,
      tp1: 2330.0,
    });
    expect(tp1Distance(trade)).toBeCloseTo(15.5);
  });

  it("tp2Distance returns absolute distance when tp2 is set", () => {
    const trade = makeTrade({
      proposedEntry: 2345.5,
      tp2: 2375.25,
    });
    expect(tp2Distance(trade)).toBeCloseTo(29.75);
  });

  it("tp2Distance returns undefined when tp2 is missing", () => {
    const trade = makeTrade({ tp2: undefined });
    expect(tp2Distance(trade)).toBeUndefined();
  });

  it("riskRewardMultiple returns the stored riskReward when finite", () => {
    const trade = makeTrade({ riskReward: 2.4 });
    expect(riskRewardMultiple(trade)).toBeCloseTo(2.4);
  });

  it("riskRewardMultiple derives tp1/stop ratio when stored value is not finite", () => {
    const trade = makeTrade({
      proposedEntry: 2345.5,
      stopLoss: 2335.0,
      tp1: 2366.5,
      riskReward: Number.NaN,
    });
    expect(riskRewardMultiple(trade)).toBeCloseTo(2);
  });

  it("riskRewardMultiple returns 0 when risk distance is zero", () => {
    const trade = makeTrade({
      proposedEntry: 2345.5,
      stopLoss: 2345.5,
      tp1: 2360,
      riskReward: Number.NaN,
    });
    expect(riskRewardMultiple(trade)).toBe(0);
  });
});

describe("trade-detail selectors — buildLevels", () => {
  it("includes Entry, Stop, TP1, R:R, Score by default", () => {
    const rows = buildLevels(makeTrade());
    expect(rows.map((r) => r.label)).toEqual([
      "Entry",
      "Stop",
      "TP1",
      "R:R",
      "Score",
    ]);
  });

  it("appends TP2 when defined", () => {
    const rows = buildLevels(makeTrade({ tp2: 2375.25 }));
    expect(rows.map((r) => r.label)).toEqual([
      "Entry",
      "Stop",
      "TP1",
      "TP2",
      "R:R",
      "Score",
    ]);
    const tp2 = rows.find((r) => r.label === "TP2");
    expect(tp2?.value).toBe("2375.25");
  });

  it("formats numeric fields to 2 decimal places", () => {
    const rows = buildLevels(
      makeTrade({
        proposedEntry: 2345.5,
        stopLoss: 2335,
        tp1: 2360.1,
        riskReward: 2.3333,
      }),
    );
    const byLabel = Object.fromEntries(rows.map((r) => [r.label, r.value]));
    expect(byLabel.Entry).toBe("2345.50");
    expect(byLabel.Stop).toBe("2335.00");
    expect(byLabel.TP1).toBe("2360.10");
    expect(byLabel["R:R"]).toBe("2.33");
  });

  it("renders Score without formatting", () => {
    const rows = buildLevels(makeTrade({ score: 92 }));
    const score = rows.find((r) => r.label === "Score");
    expect(score?.value).toBe("92");
  });
});

describe("trade-detail selectors — buildTimeline", () => {
  it("returns empty array for empty timeline", () => {
    expect(buildTimeline(makeTrade())).toEqual([]);
  });

  it("sorts events newest-first and flags the latest", () => {
    const early = makeEvent("2026-04-14T08:00:00.000Z", "created");
    const middle = makeEvent("2026-04-14T09:00:00.000Z", "approved");
    const latest = makeEvent("2026-04-14T10:00:00.000Z", "triggered");
    const rows = buildTimeline(
      makeTrade({ timeline: [early, latest, middle] }),
    );
    expect(rows.map((r) => r.event.at)).toEqual([
      "2026-04-14T10:00:00.000Z",
      "2026-04-14T09:00:00.000Z",
      "2026-04-14T08:00:00.000Z",
    ]);
    expect(rows[0]?.isLatest).toBe(true);
    expect(rows[1]?.isLatest).toBe(false);
    expect(rows[2]?.isLatest).toBe(false);
  });

  it("does not mutate the input timeline", () => {
    const events = [
      makeEvent("2026-04-14T08:00:00.000Z"),
      makeEvent("2026-04-14T10:00:00.000Z"),
    ];
    const original = [...events];
    buildTimeline(makeTrade({ timeline: events }));
    expect(events).toEqual(original);
  });
});

describe("trade-detail selectors — toTradeDetailView", () => {
  it("maps status, engine, and session labels", () => {
    const view = toTradeDetailView(
      makeTrade({
        status: "executed",
        engineTier: "aggressive",
        sessionTag: "london",
      }),
    );
    expect(view.statusLabel).toBe("In flight");
    expect(view.engineLabel).toBe("Aggressive engine");
    expect(view.sessionLabel).toBe("London");
  });

  it("marks created trades as open with approve+cancel affordances", () => {
    const view = toTradeDetailView(makeTrade({ status: "created" }));
    expect(view.isOpen).toBe(true);
    expect(view.isClosed).toBe(false);
    expect(view.canApprove).toBe(true);
    expect(view.canCancel).toBe(true);
    expect(view.canExecute).toBe(false);
  });

  it("marks approved trades as cancellable and executable but not approvable", () => {
    const view = toTradeDetailView(makeTrade({ status: "approved" }));
    expect(view.isOpen).toBe(true);
    expect(view.canApprove).toBe(false);
    expect(view.canCancel).toBe(true);
    expect(view.canExecute).toBe(true);
  });

  it("marks executed trades as open without approve/cancel/execute", () => {
    const view = toTradeDetailView(makeTrade({ status: "executed" }));
    expect(view.isOpen).toBe(true);
    expect(view.isClosed).toBe(false);
    expect(view.canApprove).toBe(false);
    expect(view.canCancel).toBe(false);
    expect(view.canExecute).toBe(false);
  });

  it("marks expired trades as closed without execute", () => {
    const view = toTradeDetailView(makeTrade({ status: "expired" }));
    expect(view.isClosed).toBe(true);
    expect(view.isOpen).toBe(false);
    expect(view.canExecute).toBe(false);
  });

  it("marks cancelled trades as closed without execute", () => {
    const view = toTradeDetailView(makeTrade({ status: "cancelled" }));
    expect(view.isClosed).toBe(true);
    expect(view.canExecute).toBe(false);
  });

  it("treats risk_blocked without autopsy as open (no autopsy, no expired/cancelled)", () => {
    const view = toTradeDetailView(makeTrade({ status: "risk_blocked" }));
    expect(view.isOpen).toBe(true);
    expect(view.isClosed).toBe(false);
    expect(view.canExecute).toBe(false);
  });

  it("treats any trade with an autopsy as closed, even if status is executed", () => {
    const autopsy: TradeAutopsy = {
      outcome: "win",
      exitPrice: 2360,
      exitReason: "Took TP1",
      pnl: 150,
      pnlR: 1.5,
      durationMinutes: 45,
      lessons: [],
    };
    const view = toTradeDetailView(
      makeTrade({ status: "executed", autopsy }),
    );
    expect(view.isClosed).toBe(true);
    expect(view.isOpen).toBe(false);
    expect(view.canExecute).toBe(false);
  });

  it("blocks execute on approved trades that already have an autopsy", () => {
    const autopsy: TradeAutopsy = {
      outcome: "breakeven",
      exitPrice: 2345.5,
      exitReason: "Manual close",
      pnl: 0,
      pnlR: 0,
      durationMinutes: 20,
      lessons: [],
    };
    const view = toTradeDetailView(
      makeTrade({ status: "approved", autopsy }),
    );
    expect(view.isClosed).toBe(true);
    expect(view.canExecute).toBe(false);
  });

  it("returns the same trade reference on the view", () => {
    const trade = makeTrade();
    const view = toTradeDetailView(trade);
    expect(view.trade).toBe(trade);
  });

  it("embeds levels and sorted timeline", () => {
    const view = toTradeDetailView(
      makeTrade({
        tp2: 2370,
        timeline: [
          makeEvent("2026-04-14T08:00:00.000Z", "created"),
          makeEvent("2026-04-14T10:00:00.000Z", "triggered"),
        ],
      }),
    );
    expect(view.levels.some((l) => l.label === "TP2")).toBe(true);
    expect(view.timeline[0]?.event.at).toBe("2026-04-14T10:00:00.000Z");
    expect(view.timeline[0]?.isLatest).toBe(true);
  });
});
