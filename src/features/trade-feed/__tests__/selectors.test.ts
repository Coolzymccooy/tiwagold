import type { Trade } from "@/types/trade";

import {
  isActiveTrade,
  isClosedTrade,
  isPendingTrade,
  selectTradeFeed,
  toTradeFeedItem,
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

describe("trade-feed selectors — status predicates", () => {
  it("isActiveTrade matches executed and approved", () => {
    expect(isActiveTrade(makeTrade({ status: "executed" }))).toBe(true);
    expect(isActiveTrade(makeTrade({ status: "approved" }))).toBe(true);
    expect(isActiveTrade(makeTrade({ status: "created" }))).toBe(false);
    expect(isActiveTrade(makeTrade({ status: "expired" }))).toBe(false);
  });

  it("isPendingTrade matches only created", () => {
    expect(isPendingTrade(makeTrade({ status: "created" }))).toBe(true);
    expect(isPendingTrade(makeTrade({ status: "executed" }))).toBe(false);
  });

  it("isClosedTrade matches expired, cancelled, risk_blocked", () => {
    expect(isClosedTrade(makeTrade({ status: "expired" }))).toBe(true);
    expect(isClosedTrade(makeTrade({ status: "cancelled" }))).toBe(true);
    expect(isClosedTrade(makeTrade({ status: "risk_blocked" }))).toBe(true);
    expect(isClosedTrade(makeTrade({ status: "executed" }))).toBe(false);
  });
});

describe("trade-feed selectors — toTradeFeedItem", () => {
  it("maps fields and formats positive pnlR with + prefix", () => {
    const item = toTradeFeedItem(
      makeTrade({ status: "executed", currentPnlR: 0.4567 }),
    );
    expect(item.directionLabel).toBe("BUY");
    expect(item.engineTier).toBe("conservative");
    expect(item.pnlRLabel).toBe("+0.46R");
    expect(item.isActive).toBe(true);
    expect(item.isPending).toBe(false);
    expect(item.isClosed).toBe(false);
  });

  it("formats negative pnlR without + prefix", () => {
    const item = toTradeFeedItem(
      makeTrade({ status: "expired", currentPnlR: -1.2 }),
    );
    expect(item.pnlRLabel).toBe("-1.20R");
    expect(item.isClosed).toBe(true);
  });

  it("returns null pnlRLabel when currentPnlR is undefined", () => {
    const item = toTradeFeedItem(makeTrade({ currentPnlR: undefined }));
    expect(item.pnlRLabel).toBeNull();
  });

  it("returns null pnlRLabel when currentPnlR is NaN", () => {
    const item = toTradeFeedItem(makeTrade({ currentPnlR: Number.NaN }));
    expect(item.pnlRLabel).toBeNull();
  });
});

describe("trade-feed selectors — selectTradeFeed", () => {
  const older = makeTrade({
    id: "old",
    status: "created",
    updatedAt: "2026-04-14T08:00:00.000Z",
  });
  const newer = makeTrade({
    id: "new",
    status: "executed",
    updatedAt: "2026-04-14T10:00:00.000Z",
  });
  const closed = makeTrade({
    id: "closed",
    status: "expired",
    updatedAt: "2026-04-14T09:00:00.000Z",
  });

  it("returns empty array when input is undefined", () => {
    expect(selectTradeFeed(undefined, "all")).toEqual([]);
  });

  it("returns empty array when input is empty", () => {
    expect(selectTradeFeed([], "all")).toEqual([]);
  });

  it("returns all items sorted newest-first when filter is 'all'", () => {
    const feed = selectTradeFeed([older, newer, closed], "all");
    expect(feed.map((i) => i.trade.id)).toEqual(["new", "closed", "old"]);
  });

  it("filters to active when filter is 'active'", () => {
    const feed = selectTradeFeed([older, newer, closed], "active");
    expect(feed.map((i) => i.trade.id)).toEqual(["new"]);
  });

  it("filters to pending when filter is 'pending'", () => {
    const feed = selectTradeFeed([older, newer, closed], "pending");
    expect(feed.map((i) => i.trade.id)).toEqual(["old"]);
  });

  it("filters to closed when filter is 'closed'", () => {
    const feed = selectTradeFeed([older, newer, closed], "closed");
    expect(feed.map((i) => i.trade.id)).toEqual(["closed"]);
  });

  it("does not mutate the input array", () => {
    const trades = [older, newer, closed];
    const original = [...trades];
    selectTradeFeed(trades, "all");
    expect(trades).toEqual(original);
  });

  it("filters out trades whose engine tier is disabled", () => {
    const conservative = makeTrade({
      id: "c1",
      status: "executed",
      engineTier: "conservative",
    });
    const aggressive = makeTrade({
      id: "a1",
      status: "executed",
      engineTier: "aggressive",
    });
    const feed = selectTradeFeed([conservative, aggressive], "all", {
      conservative: true,
      aggressive: false,
    });
    expect(feed.map((i) => i.trade.id)).toEqual(["c1"]);
  });

  it("does not filter when engineEnabled is omitted", () => {
    const conservative = makeTrade({
      id: "c1",
      status: "executed",
      engineTier: "conservative",
    });
    const aggressive = makeTrade({
      id: "a1",
      status: "executed",
      engineTier: "aggressive",
    });
    const feed = selectTradeFeed([conservative, aggressive], "all");
    expect(feed).toHaveLength(2);
  });
});
