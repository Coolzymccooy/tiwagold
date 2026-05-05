import type { AnalyticsSummary } from "@/types/analytics";

import { toAnalyticsView } from "../selectors";

function makeSummary(
  overrides: Partial<AnalyticsSummary> = {},
): AnalyticsSummary {
  const base: AnalyticsSummary = {
    range: "30d",
    totalTrades: 10,
    activeTrades: 3,
    closedTrades: 7,
    winRate: 0.6,
    avgR: 0.45,
    totalR: 4.5,
    bestTradeR: 2.1,
    worstTradeR: -1.2,
    expectancy: 0.35,
    equityCurve: [],
    byEngine: [],
    bySession: [],
    byMode: [],
    streak: { kind: "win", count: 3 },
  };
  return { ...base, ...overrides };
}

describe("analytics selectors — toAnalyticsView", () => {
  it("returns undefined when summary is undefined", () => {
    expect(toAnalyticsView(undefined)).toBeUndefined();
  });

  it("sets hasData=false when totalTrades is 0", () => {
    const view = toAnalyticsView(makeSummary({ totalTrades: 0 }));
    expect(view?.hasData).toBe(false);
  });

  it("sets hasData=true when at least one trade exists", () => {
    const view = toAnalyticsView(makeSummary({ totalTrades: 1 }));
    expect(view?.hasData).toBe(true);
  });
});

describe("analytics selectors — KPIs", () => {
  it("formats totalTrades as an integer with neutral tone", () => {
    const view = toAnalyticsView(makeSummary({ totalTrades: 42 }));
    const kpi = view?.kpis.find((k) => k.id === "totalTrades");
    expect(kpi?.value).toBe("42");
    expect(kpi?.tone).toBe("neutral");
  });

  it("formats winRate as a whole-number percentage", () => {
    const view = toAnalyticsView(makeSummary({ winRate: 0.57 }));
    const kpi = view?.kpis.find((k) => k.id === "winRate");
    expect(kpi?.value).toBe("57%");
  });

  it("marks winRate >= 0.5 as positive and below as negative", () => {
    const high = toAnalyticsView(makeSummary({ winRate: 0.5 }));
    const low = toAnalyticsView(makeSummary({ winRate: 0.49 }));
    expect(high?.kpis.find((k) => k.id === "winRate")?.tone).toBe("positive");
    expect(low?.kpis.find((k) => k.id === "winRate")?.tone).toBe("negative");
  });

  it("formats R values with + prefix when positive and no prefix when negative or zero", () => {
    const view = toAnalyticsView(
      makeSummary({
        avgR: 0.456,
        totalR: -2.1,
        bestTradeR: 3,
        worstTradeR: -0.5,
        expectancy: 0,
      }),
    );
    const byId = Object.fromEntries(
      (view?.kpis ?? []).map((k) => [k.id, k.value]),
    );
    expect(byId.avgR).toBe("+0.46R");
    expect(byId.totalR).toBe("-2.10R");
    expect(byId.bestTrade).toBe("+3.00R");
    expect(byId.worstTrade).toBe("-0.50R");
    expect(byId.expectancy).toBe("0.00R");
  });

  it("tones R-value KPIs as positive/negative/neutral based on sign", () => {
    const view = toAnalyticsView(
      makeSummary({ avgR: 0.1, totalR: -0.1, expectancy: 0 }),
    );
    const byId = Object.fromEntries(
      (view?.kpis ?? []).map((k) => [k.id, k.tone]),
    );
    expect(byId.avgR).toBe("positive");
    expect(byId.totalR).toBe("negative");
    expect(byId.expectancy).toBe("neutral");
  });

  it("renders streak as '— / neutral' when count is 0", () => {
    const view = toAnalyticsView(
      makeSummary({ streak: { kind: "win", count: 0 } }),
    );
    const streak = view?.kpis.find((k) => k.id === "streak");
    expect(streak?.value).toBe("—");
    expect(streak?.tone).toBe("neutral");
  });

  it("renders winning streak with positive tone", () => {
    const view = toAnalyticsView(
      makeSummary({ streak: { kind: "win", count: 4 } }),
    );
    const streak = view?.kpis.find((k) => k.id === "streak");
    expect(streak?.value).toBe("4 win");
    expect(streak?.tone).toBe("positive");
  });

  it("renders losing streak with negative tone", () => {
    const view = toAnalyticsView(
      makeSummary({ streak: { kind: "loss", count: 2 } }),
    );
    const streak = view?.kpis.find((k) => k.id === "streak");
    expect(streak?.value).toBe("2 loss");
    expect(streak?.tone).toBe("negative");
  });
});

describe("analytics selectors — breakdowns", () => {
  it("maps engine rows with known labels", () => {
    const view = toAnalyticsView(
      makeSummary({
        byEngine: [
          { engine: "conservative", trades: 5, winRate: 0.6, avgR: 0.3 },
          { engine: "aggressive", trades: 2, winRate: 1, avgR: 1.5 },
        ],
      }),
    );
    const engines = view?.engines ?? [];
    expect(engines[0]).toMatchObject({
      engineLabel: "Conservative",
      tradesLabel: "5 trades",
      winRateLabel: "60%",
      avgRLabel: "+0.30R",
    });
    expect(engines[1]?.engineLabel).toBe("Aggressive");
    expect(engines[1]?.avgRLabel).toBe("+1.50R");
  });

  it("maps session rows with known labels", () => {
    const view = toAnalyticsView(
      makeSummary({
        bySession: [
          { session: "london", trades: 3, winRate: 0.33, avgR: -0.2 },
          { session: "new_york", trades: 4, winRate: 0.75, avgR: 0.9 },
        ],
      }),
    );
    const sessions = view?.sessions ?? [];
    expect(sessions[0]?.sessionLabel).toBe("London");
    expect(sessions[0]?.winRateLabel).toBe("33%");
    expect(sessions[0]?.avgRLabel).toBe("-0.20R");
    expect(sessions[1]?.sessionLabel).toBe("New York");
  });

  it("maps mode rows with known labels", () => {
    const view = toAnalyticsView(
      makeSummary({
        byMode: [
          { mode: "conservative", trades: 6, winRate: 0.5, avgR: 0.1 },
          { mode: "aggressive", trades: 4, winRate: 0.25, avgR: -0.4 },
        ],
      }),
    );
    const modes = view?.modes ?? [];
    expect(modes[0]?.modeLabel).toBe("Conservative");
    expect(modes[1]?.modeLabel).toBe("Aggressive");
    expect(modes[1]?.avgRLabel).toBe("-0.40R");
  });
});

describe("analytics selectors — equity sparkline", () => {
  it("returns zeroed sparkline when equityCurve is empty", () => {
    const view = toAnalyticsView(makeSummary({ equityCurve: [] }));
    expect(view?.equity).toEqual({
      points: [],
      min: 0,
      max: 0,
      latest: null,
      changeR: 0,
    });
  });

  it("computes min/max/latest/changeR from equity points", () => {
    const points = [
      { at: "2026-04-01T00:00:00Z", equity: 10_000, rRunning: 0 },
      { at: "2026-04-07T00:00:00Z", equity: 10_250, rRunning: 1.2 },
      { at: "2026-04-14T00:00:00Z", equity: 10_180, rRunning: 2.5 },
    ];
    const view = toAnalyticsView(makeSummary({ equityCurve: points }));
    expect(view?.equity.min).toBe(10_000);
    expect(view?.equity.max).toBe(10_250);
    expect(view?.equity.latest).toEqual(points[2]);
    expect(view?.equity.changeR).toBeCloseTo(2.5);
  });
});
