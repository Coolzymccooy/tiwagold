import {
  normalizePendingTradeRow,
  parsePendingTradesResponse,
  pendingTradesResponseSchema,
} from "@/types/dto/pendingTrades";

describe("normalizePendingTradeRow", () => {
  test("camelCase fields produce a fully populated PendingTrade", () => {
    const row = {
      id: "req_1",
      symbol: "XAUUSD",
      direction: "BUY",
      entryType: "LIMIT",
      lotSize: "0.10",
      entryPrice: "2400.00",
      stopLoss: "2390.00",
      takeProfit: "2410.00",
      comment: "Tiwa-aggressive setup",
      approvalStatus: "awaiting_approval",
      createdAt: "2026-05-07T00:00:00Z",
    };
    const t = normalizePendingTradeRow(row);
    expect(t.id).toBe("req_1");
    expect(t.symbol).toBe("XAUUSD");
    expect(t.direction).toBe("BUY");
    expect(t.entryType).toBe("LIMIT");
    expect(t.lotSize).toBe(0.1);
    expect(t.entryPrice).toBe(2400);
    expect(t.stopLoss).toBe(2390);
    expect(t.takeProfit).toBe(2410);
    expect(t.engine).toBe("aggressive");
    // BUY: risk = entry - sl = 10, reward = tp - entry = 10 → 1:1
    expect(t.riskReward).toBe(1);
    expect(t.approvalStatus).toBe("awaiting_approval");
    expect(t.createdAt).toBe("2026-05-07T00:00:00Z");
  });

  test("snake_case fallbacks are honoured when camelCase is absent", () => {
    const row = {
      id: "req_2",
      symbol: "XAUUSD",
      direction: "sell",
      entry_type: "MARKET",
      lot_size: "0.05",
      entry_price: "2400",
      stop_loss: "2412",
      take_profit: "2380",
      comment: "Tiwa-conservative",
      approval_status: "awaiting_approval",
      created_at: "2026-05-07T01:02:03Z",
    };
    const t = normalizePendingTradeRow(row);
    expect(t.direction).toBe("SELL");
    expect(t.entryType).toBe("MARKET");
    expect(t.lotSize).toBe(0.05);
    expect(t.entryPrice).toBe(2400);
    expect(t.engine).toBe("conservative");
    // SELL: risk = sl - entry = 12, reward = entry - tp = 20 → 20/12 ≈ 1.67
    expect(t.riskReward).toBe(1.67);
    expect(t.createdAt).toBe("2026-05-07T01:02:03Z");
  });

  test("unknown engine when comment lacks Tiwa prefix", () => {
    const row = {
      id: "req_3",
      symbol: "XAUUSD",
      direction: "BUY",
      entry_price: "1",
      stop_loss: "0",
      take_profit: "2",
      comment: "manual",
    };
    expect(normalizePendingTradeRow(row).engine).toBe("unknown");
  });

  test("zero or negative risk yields a riskReward of 0 (not -Infinity)", () => {
    const row = {
      id: "req_4",
      symbol: "XAUUSD",
      direction: "BUY",
      entry_price: "100",
      stop_loss: "100", // same as entry → risk = 0
      take_profit: "110",
      comment: "Tiwa-aggressive",
    };
    expect(normalizePendingTradeRow(row).riskReward).toBe(0);
  });

  test("missing optional approvalExpiresAt collapses to null", () => {
    const row = {
      id: "req_5",
      symbol: "XAUUSD",
      direction: "BUY",
      entry_price: "1",
      stop_loss: "0",
      take_profit: "2",
      comment: "Tiwa-aggressive",
    };
    expect(normalizePendingTradeRow(row).approvalExpiresAt).toBeNull();
  });

  test("missing createdAt falls back to a parseable ISO string", () => {
    const row = {
      id: "req_6",
      symbol: "XAUUSD",
      direction: "BUY",
      entry_price: "1",
      stop_loss: "0",
      take_profit: "2",
      comment: "",
    };
    const out = normalizePendingTradeRow(row);
    expect(typeof out.createdAt).toBe("string");
    expect(Number.isNaN(Date.parse(out.createdAt))).toBe(false);
  });
});

describe("parsePendingTradesResponse", () => {
  test("returns [] when items is empty", () => {
    expect(parsePendingTradesResponse({ items: [] })).toEqual([]);
  });

  test("normalizes a multi-item payload", () => {
    const raw = {
      items: [
        {
          id: "a",
          symbol: "XAUUSD",
          direction: "BUY",
          entry_price: 100,
          stop_loss: 90,
          take_profit: 120,
          comment: "Tiwa-aggressive",
        },
        {
          id: "b",
          symbol: "XAUUSD",
          direction: "SELL",
          entry_price: 200,
          stop_loss: 210,
          take_profit: 180,
          comment: "Tiwa-conservative",
        },
      ],
    };
    const out = parsePendingTradesResponse(raw);
    expect(out).toHaveLength(2);
    expect(out[0]?.id).toBe("a");
    expect(out[1]?.direction).toBe("SELL");
  });

  test("rejects payloads missing items", () => {
    expect(() => pendingTradesResponseSchema.parse({})).toThrow();
  });
});
