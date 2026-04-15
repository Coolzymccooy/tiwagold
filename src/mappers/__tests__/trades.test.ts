import type {
  ExecutionStatusDto,
  TradeAutopsyDto,
  TradeDetailDto,
  TradeListItemDto,
  TradeListResponseDto,
  TradeTimelineEventDto,
} from "@/types/dto";
import type { TradeTimelineEvent } from "@/types/trade";
import { TRADE_SYMBOL } from "@/types/trade";

import {
  approveRequestToDto,
  executeRequestToDto,
  executionStatusFromDto,
  timelineEventFromDto,
  tradeAutopsyFromDto,
  tradeCandidateFromDto,
  tradeFromDto,
  tradeListFromDto,
} from "../trades";

const baseListItem: TradeListItemDto = {
  id: "trade-1",
  symbol: "XAUUSD",
  side: "buy",
  status: "pending",
  engine: "sniper",
  score: 87,
  levels: {
    entry: "2000.00",
    stop_loss: "1990.00",
    take_profit: ["2010.00", "2020.00"],
    current_price: "2001.50",
  },
  risk: {
    account_risk_pct: "1.00",
    position_size_lots: "0.50",
    reward_to_risk: "2.00",
    max_loss: "50.00",
    max_gain: "100.00",
  },
  context: {
    session: "london",
    mode: "intraday",
    narrative: "London breakout",
    macro_tags: ["DXY-weak", "CPI-miss"],
    confidence: 0.85,
  },
  logic_version: "v3.1",
  candidate_status: "queued",
  created_at: "2026-04-14T08:00:00Z",
  updated_at: "2026-04-14T08:05:00Z",
};

describe("timelineEventFromDto", () => {
  const KNOWN: TradeTimelineEvent["kind"][] = [
    "created",
    "approved",
    "risk_blocked",
    "triggered",
    "tp1_hit",
    "tp2_hit",
    "stop_hit",
    "expired",
    "cancelled",
    "note",
  ];

  it.each(KNOWN)("passes through known kind %s", (kind) => {
    const dto: TradeTimelineEventDto = {
      id: "e1",
      at: "2026-04-14T08:00:00Z",
      kind,
      summary: "s",
    };
    expect(timelineEventFromDto(dto).kind).toBe(kind);
  });

  it("falls back to 'note' for unknown kind", () => {
    const dto: TradeTimelineEventDto = {
      id: "e1",
      at: "2026-04-14T08:00:00Z",
      kind: "mystery_kind",
      summary: "s",
    };
    expect(timelineEventFromDto(dto).kind).toBe("note");
  });

  it("maps detail: null to undefined", () => {
    const dto: TradeTimelineEventDto = {
      id: "e1",
      at: "2026-04-14T08:00:00Z",
      kind: "note",
      summary: "s",
      detail: null,
    };
    expect(timelineEventFromDto(dto).detail).toBeUndefined();
  });

  it("maps detail: undefined to undefined", () => {
    const dto: TradeTimelineEventDto = {
      id: "e1",
      at: "2026-04-14T08:00:00Z",
      kind: "note",
      summary: "s",
    };
    expect(timelineEventFromDto(dto).detail).toBeUndefined();
  });

  it("passes through non-empty detail string", () => {
    const dto: TradeTimelineEventDto = {
      id: "e1",
      at: "2026-04-14T08:00:00Z",
      kind: "note",
      summary: "s",
      detail: "more info",
    };
    expect(timelineEventFromDto(dto).detail).toBe("more info");
  });

  it("copies id, at, and summary verbatim", () => {
    const dto: TradeTimelineEventDto = {
      id: "e1",
      at: "2026-04-14T08:00:00Z",
      kind: "created",
      summary: "Trade created",
    };
    const out = timelineEventFromDto(dto);
    expect(out.id).toBe("e1");
    expect(out.at).toBe("2026-04-14T08:00:00Z");
    expect(out.summary).toBe("Trade created");
  });
});

describe("tradeAutopsyFromDto", () => {
  const base: TradeAutopsyDto = {
    summary: "closed at tp1",
    lessons: ["hold longer"],
    rating: 3,
  };

  it("maps rating 5 to win", () => {
    expect(tradeAutopsyFromDto({ ...base, rating: 5 }).outcome).toBe("win");
  });

  it("maps rating 3 to win", () => {
    expect(tradeAutopsyFromDto({ ...base, rating: 3 }).outcome).toBe("win");
  });

  it("maps rating 2 to breakeven", () => {
    expect(tradeAutopsyFromDto({ ...base, rating: 2 }).outcome).toBe(
      "breakeven",
    );
  });

  it("maps rating 1 to loss", () => {
    expect(tradeAutopsyFromDto({ ...base, rating: 1 }).outcome).toBe("loss");
  });

  it("maps rating 0 to loss", () => {
    expect(tradeAutopsyFromDto({ ...base, rating: 0 }).outcome).toBe("loss");
  });

  it("hardcodes numeric fields to 0", () => {
    const out = tradeAutopsyFromDto(base);
    expect(out.exitPrice).toBe(0);
    expect(out.pnl).toBe(0);
    expect(out.pnlR).toBe(0);
    expect(out.durationMinutes).toBe(0);
  });

  it("sets exitReason from summary", () => {
    expect(tradeAutopsyFromDto(base).exitReason).toBe("closed at tp1");
  });

  it("passes lessons through", () => {
    const out = tradeAutopsyFromDto({
      ...base,
      lessons: ["a", "b", "c"],
    });
    expect(out.lessons).toEqual(["a", "b", "c"]);
  });
});

describe("executionStatusFromDto", () => {
  const base: ExecutionStatusDto = {
    trade_id: "trade-1",
    phase: "filled",
    attempt: 1,
    last_checked_at: "2026-04-14T08:10:00Z",
  };

  it("snake_cases trade_id and last_checked_at to camelCase", () => {
    const out = executionStatusFromDto(base);
    expect(out.tradeId).toBe("trade-1");
    expect(out.lastCheckedAt).toBe("2026-04-14T08:10:00Z");
  });

  it("preserves phase and attempt", () => {
    const out = executionStatusFromDto({ ...base, phase: "routing", attempt: 3 });
    expect(out.phase).toBe("routing");
    expect(out.attempt).toBe(3);
  });

  it("maps missing broker_ticket to null", () => {
    expect(executionStatusFromDto(base).brokerTicket).toBeNull();
  });

  it("maps broker_ticket: null to null", () => {
    expect(
      executionStatusFromDto({ ...base, broker_ticket: null }).brokerTicket,
    ).toBeNull();
  });

  it("passes through broker_ticket string", () => {
    expect(
      executionStatusFromDto({ ...base, broker_ticket: "BK-123" }).brokerTicket,
    ).toBe("BK-123");
  });

  it("maps missing filled_price/slippage to undefined", () => {
    const out = executionStatusFromDto(base);
    expect(out.filledPrice).toBeUndefined();
    expect(out.slippage).toBeUndefined();
  });

  it("maps filled_price/slippage null to undefined", () => {
    const out = executionStatusFromDto({
      ...base,
      filled_price: null,
      slippage: null,
    });
    expect(out.filledPrice).toBeUndefined();
    expect(out.slippage).toBeUndefined();
  });

  it("parses filled_price and slippage as numbers", () => {
    const out = executionStatusFromDto({
      ...base,
      filled_price: "2001.25",
      slippage: "0.10",
    });
    expect(out.filledPrice).toBeCloseTo(2001.25);
    expect(out.slippage).toBeCloseTo(0.1);
  });

  it("maps null optional strings to undefined", () => {
    const out = executionStatusFromDto({
      ...base,
      filled_at: null,
      rejection_code: null,
      rejection_message: null,
    });
    expect(out.filledAt).toBeUndefined();
    expect(out.rejectionCode).toBeUndefined();
    expect(out.rejectionMessage).toBeUndefined();
  });

  it("passes through optional string values", () => {
    const out = executionStatusFromDto({
      ...base,
      filled_at: "2026-04-14T08:11:00Z",
      rejection_code: "E42",
      rejection_message: "no liquidity",
    });
    expect(out.filledAt).toBe("2026-04-14T08:11:00Z");
    expect(out.rejectionCode).toBe("E42");
    expect(out.rejectionMessage).toBe("no liquidity");
  });
});

describe("tradeCandidateFromDto", () => {
  it("falls back to entry when take_profit is empty", () => {
    const dto: TradeListItemDto = {
      ...baseListItem,
      levels: { ...baseListItem.levels, take_profit: [] },
    };
    const out = tradeCandidateFromDto(dto);
    expect(out.tp1).toBe(out.proposedEntry);
    expect(out.tp2).toBeUndefined();
  });

  it("uses first TP as tp1 when only one is provided", () => {
    const dto: TradeListItemDto = {
      ...baseListItem,
      levels: { ...baseListItem.levels, take_profit: ["2010.00"] },
    };
    const out = tradeCandidateFromDto(dto);
    expect(out.tp1).toBeCloseTo(2010);
    expect(out.tp2).toBeUndefined();
  });

  it("maps first two TPs when provided", () => {
    const out = tradeCandidateFromDto(baseListItem);
    expect(out.tp1).toBeCloseTo(2010);
    expect(out.tp2).toBeCloseTo(2020);
  });

  it("hardcodes setupType, htfTrend, ltfStructure to empty strings", () => {
    const out = tradeCandidateFromDto(baseListItem);
    expect(out.setupType).toBe("");
    expect(out.htfTrend).toBe("");
    expect(out.ltfStructure).toBe("");
  });

  it("sets dedupeKey equal to id", () => {
    const out = tradeCandidateFromDto(baseListItem);
    expect(out.dedupeKey).toBe(baseListItem.id);
  });

  it("sets expiresAt equal to updated_at", () => {
    const out = tradeCandidateFromDto(baseListItem);
    expect(out.expiresAt).toBe(baseListItem.updated_at);
  });

  it("maps symbol to TRADE_SYMBOL constant", () => {
    const out = tradeCandidateFromDto(baseListItem);
    expect(out.symbol).toBe(TRADE_SYMBOL);
  });

  it("maps direction buy -> BUY and sell -> SELL", () => {
    expect(tradeCandidateFromDto(baseListItem).direction).toBe("BUY");
    expect(
      tradeCandidateFromDto({ ...baseListItem, side: "sell" }).direction,
    ).toBe("SELL");
  });

  it("collapses overlap session to london", () => {
    const out = tradeCandidateFromDto({
      ...baseListItem,
      context: { ...baseListItem.context, session: "overlap" },
    });
    expect(out.sessionTag).toBe("london");
  });

  it("maps mode scalp/intraday -> conservative, swing -> aggressive", () => {
    expect(
      tradeCandidateFromDto({
        ...baseListItem,
        context: { ...baseListItem.context, mode: "scalp" },
      }).mode,
    ).toBe("conservative");
    expect(
      tradeCandidateFromDto({
        ...baseListItem,
        context: { ...baseListItem.context, mode: "swing" },
      }).mode,
    ).toBe("aggressive");
  });

  it("parses entry, stopLoss, currentPrice, and riskReward as numbers", () => {
    const out = tradeCandidateFromDto(baseListItem);
    expect(out.proposedEntry).toBeCloseTo(2000);
    expect(out.stopLoss).toBeCloseTo(1990);
    expect(out.currentPrice).toBeCloseTo(2001.5);
    expect(out.riskReward).toBeCloseTo(2);
  });

  it("passes through score, logic_version, macro_tags, narrative", () => {
    const out = tradeCandidateFromDto(baseListItem);
    expect(out.score).toBe(87);
    expect(out.strategyTag).toBe("v3.1");
    expect(out.confluenceTags).toEqual(["DXY-weak", "CPI-miss"]);
    expect(out.thesisSummary).toBe("London breakout");
  });
});

describe("tradeFromDto", () => {
  const detail: TradeDetailDto = {
    ...baseListItem,
    timeline: [
      {
        id: "e1",
        at: "2026-04-14T08:00:00Z",
        kind: "created",
        summary: "Trade created",
      },
      {
        id: "e2",
        at: "2026-04-14T08:01:00Z",
        kind: "approved",
        summary: "Approved",
      },
    ],
  };

  it("maps timeline array via timelineEventFromDto", () => {
    const out = tradeFromDto(detail);
    expect(out.timeline).toHaveLength(2);
    expect(out.timeline[0]?.kind).toBe("created");
    expect(out.timeline[1]?.kind).toBe("approved");
  });

  it("maps autopsy: undefined -> undefined", () => {
    expect(tradeFromDto(detail).autopsy).toBeUndefined();
  });

  it("maps autopsy: null -> undefined", () => {
    expect(tradeFromDto({ ...detail, autopsy: null }).autopsy).toBeUndefined();
  });

  it("maps autopsy object via tradeAutopsyFromDto", () => {
    const out = tradeFromDto({
      ...detail,
      autopsy: { summary: "tp2 hit", lessons: ["scale out"], rating: 4 },
    });
    expect(out.autopsy).toBeDefined();
    expect(out.autopsy?.outcome).toBe("win");
    expect(out.autopsy?.exitReason).toBe("tp2 hit");
    expect(out.autopsy?.lessons).toEqual(["scale out"]);
  });

  it("extends TradeCandidate fields", () => {
    const out = tradeFromDto(detail);
    expect(out.id).toBe(detail.id);
    expect(out.dedupeKey).toBe(detail.id);
    expect(out.symbol).toBe(TRADE_SYMBOL);
  });
});

describe("tradeListFromDto", () => {
  it("maps trades via tradeCandidateFromDto", () => {
    const dto: TradeListResponseDto = { trades: [baseListItem] };
    const out = tradeListFromDto(dto);
    expect(out.trades).toHaveLength(1);
    expect(out.trades[0]?.id).toBe(baseListItem.id);
  });

  it("maps next_cursor: undefined -> nextCursor: undefined", () => {
    expect(tradeListFromDto({ trades: [] }).nextCursor).toBeUndefined();
  });

  it("maps next_cursor: null -> nextCursor: undefined", () => {
    expect(
      tradeListFromDto({ trades: [], next_cursor: null }).nextCursor,
    ).toBeUndefined();
  });

  it("passes next_cursor string through", () => {
    expect(
      tradeListFromDto({ trades: [], next_cursor: "abc" }).nextCursor,
    ).toBe("abc");
  });
});

describe("approveRequestToDto", () => {
  it("omits note field when not provided", () => {
    const dto = approveRequestToDto({ intentToken: "tok-1" });
    expect(dto).toEqual({ intent_token: "tok-1" });
    expect("note" in dto).toBe(false);
  });

  it("includes note when provided", () => {
    const dto = approveRequestToDto({ intentToken: "tok-1", note: "ok" });
    expect(dto).toEqual({ intent_token: "tok-1", note: "ok" });
  });

  it("includes empty-string note when provided", () => {
    const dto = approveRequestToDto({ intentToken: "tok-1", note: "" });
    expect(dto).toEqual({ intent_token: "tok-1", note: "" });
  });
});

describe("executeRequestToDto", () => {
  it("omits override_lots when not provided", () => {
    const dto = executeRequestToDto({ intentToken: "tok-1" });
    expect(dto).toEqual({ intent_token: "tok-1" });
    expect("override_lots" in dto).toBe(false);
  });

  it("formats override_lots with 2 decimal places", () => {
    const dto = executeRequestToDto({ intentToken: "tok-1", overrideLots: 0.5 });
    expect(dto.override_lots).toBe("0.50");
  });

  it("formats whole-number override_lots with 2 decimal places", () => {
    const dto = executeRequestToDto({ intentToken: "tok-1", overrideLots: 1 });
    expect(dto.override_lots).toBe("1.00");
  });

  it("includes override_lots when explicitly 0", () => {
    const dto = executeRequestToDto({ intentToken: "tok-1", overrideLots: 0 });
    expect(dto.override_lots).toBe("0.00");
  });
});
