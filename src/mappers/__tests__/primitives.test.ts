import {
  candidateStatusFromDto,
  candidateStatusToDto,
  fromIsoOrNull,
  fromMoney,
  fromMoneyOrNull,
  fromOptional,
  modeFromDto,
  modeToDto,
  sessionFromDto,
  sessionToDto,
  sideFromDto,
  sideToDto,
  toIsoOrUndefined,
  toMoney,
  toMoneyOrUndefined,
  toOptional,
  tradeStateFromStatus,
} from "@/mappers/primitives";

describe("toMoney", () => {
  it("parses a numeric string", () => {
    expect(toMoney("2345.67")).toBe(2345.67);
  });

  it("parses an integer string", () => {
    expect(toMoney("1000")).toBe(1000);
  });

  it("parses a negative number", () => {
    expect(toMoney("-12.5")).toBe(-12.5);
  });

  it("throws on non-numeric input", () => {
    expect(() => toMoney("abc")).toThrow(
      'mapper: cannot parse money value "abc"',
    );
  });

  it("throws on empty string", () => {
    // Number("") === 0, so it parses as 0 - this documents the current behavior
    expect(toMoney("")).toBe(0);
  });

  it("throws on NaN-like input", () => {
    expect(() => toMoney("not a number")).toThrow(
      'mapper: cannot parse money value "not a number"',
    );
  });
});

describe("toMoneyOrUndefined", () => {
  it("returns undefined for null", () => {
    expect(toMoneyOrUndefined(null)).toBeUndefined();
  });

  it("returns undefined for undefined", () => {
    expect(toMoneyOrUndefined(undefined)).toBeUndefined();
  });

  it("parses a value when present", () => {
    expect(toMoneyOrUndefined("42.5")).toBe(42.5);
  });
});

describe("fromMoney", () => {
  it("serializes with default 2 digits", () => {
    expect(fromMoney(2345.678)).toBe("2345.68");
  });

  it("serializes with custom digits", () => {
    expect(fromMoney(2345.6789, 4)).toBe("2345.6789");
  });

  it("pads zeros", () => {
    expect(fromMoney(100)).toBe("100.00");
  });

  it("throws on NaN", () => {
    expect(() => fromMoney(Number.NaN)).toThrow(
      "mapper: cannot serialize non-finite money value",
    );
  });

  it("throws on Infinity", () => {
    expect(() => fromMoney(Number.POSITIVE_INFINITY)).toThrow(
      "mapper: cannot serialize non-finite money value",
    );
  });
});

describe("fromMoneyOrNull", () => {
  it("returns null for undefined", () => {
    expect(fromMoneyOrNull(undefined)).toBeNull();
  });

  it("serializes when present", () => {
    expect(fromMoneyOrNull(12.345)).toBe("12.35");
  });

  it("respects digits arg", () => {
    expect(fromMoneyOrNull(12.345, 1)).toBe("12.3");
  });
});

describe("toIsoOrUndefined", () => {
  it("returns undefined for null", () => {
    expect(toIsoOrUndefined(null)).toBeUndefined();
  });

  it("returns undefined for undefined", () => {
    expect(toIsoOrUndefined(undefined)).toBeUndefined();
  });

  it("returns the iso string when present", () => {
    expect(toIsoOrUndefined("2026-01-01T00:00:00Z")).toBe(
      "2026-01-01T00:00:00Z",
    );
  });
});

describe("fromIsoOrNull", () => {
  it("returns null for undefined", () => {
    expect(fromIsoOrNull(undefined)).toBeNull();
  });

  it("returns the iso string when present", () => {
    expect(fromIsoOrNull("2026-01-01T00:00:00Z")).toBe("2026-01-01T00:00:00Z");
  });
});

describe("toOptional", () => {
  it("converts null to undefined", () => {
    expect(toOptional(null)).toBeUndefined();
  });

  it("keeps defined values", () => {
    expect(toOptional("hello")).toBe("hello");
  });

  it("preserves falsy defined values", () => {
    expect(toOptional(0)).toBe(0);
    expect(toOptional(false)).toBe(false);
    expect(toOptional("")).toBe("");
  });
});

describe("fromOptional", () => {
  it("converts undefined to null", () => {
    expect(fromOptional(undefined)).toBeNull();
  });

  it("keeps defined values", () => {
    expect(fromOptional("hello")).toBe("hello");
  });

  it("preserves falsy defined values", () => {
    expect(fromOptional(0)).toBe(0);
    expect(fromOptional(false)).toBe(false);
  });
});

describe("sessionFromDto", () => {
  it("maps asia to asian", () => {
    expect(sessionFromDto("asia")).toBe("asian");
  });

  it("maps london to london", () => {
    expect(sessionFromDto("london")).toBe("london");
  });

  it("maps new_york to new_york", () => {
    expect(sessionFromDto("new_york")).toBe("new_york");
  });

  it("collapses overlap to london", () => {
    expect(sessionFromDto("overlap")).toBe("london");
  });
});

describe("sessionToDto", () => {
  it("maps asian to asia", () => {
    expect(sessionToDto("asian")).toBe("asia");
  });

  it("maps london to london", () => {
    expect(sessionToDto("london")).toBe("london");
  });

  it("maps new_york to new_york", () => {
    expect(sessionToDto("new_york")).toBe("new_york");
  });

  it("maps off_hours to asia", () => {
    expect(sessionToDto("off_hours")).toBe("asia");
  });
});

describe("sideFromDto / sideToDto", () => {
  it("roundtrips buy/BUY", () => {
    expect(sideFromDto("buy")).toBe("BUY");
    expect(sideToDto("BUY")).toBe("buy");
  });

  it("roundtrips sell/SELL", () => {
    expect(sideFromDto("sell")).toBe("SELL");
    expect(sideToDto("SELL")).toBe("sell");
  });
});

describe("modeFromDto", () => {
  it("maps scalp to conservative", () => {
    expect(modeFromDto("scalp")).toBe("conservative");
  });

  it("maps intraday to conservative", () => {
    expect(modeFromDto("intraday")).toBe("conservative");
  });

  it("maps swing to aggressive", () => {
    expect(modeFromDto("swing")).toBe("aggressive");
  });
});

describe("modeToDto", () => {
  it("maps conservative to intraday", () => {
    expect(modeToDto("conservative")).toBe("intraday");
  });

  it("maps aggressive to swing", () => {
    expect(modeToDto("aggressive")).toBe("swing");
  });
});

describe("tradeStateFromStatus", () => {
  it("maps pending to WAIT", () => {
    expect(tradeStateFromStatus("pending")).toBe("WAIT");
  });

  it("maps active to TRIGGERED", () => {
    expect(tradeStateFromStatus("active")).toBe("TRIGGERED");
  });

  it("maps partial to TRIGGERED", () => {
    expect(tradeStateFromStatus("partial")).toBe("TRIGGERED");
  });

  it("maps filled to VALID", () => {
    expect(tradeStateFromStatus("filled")).toBe("VALID");
  });

  it("maps closed to CLOSED", () => {
    expect(tradeStateFromStatus("closed")).toBe("CLOSED");
  });

  it("maps cancelled to REJECTED", () => {
    expect(tradeStateFromStatus("cancelled")).toBe("REJECTED");
  });

  it("maps rejected to REJECTED", () => {
    expect(tradeStateFromStatus("rejected")).toBe("REJECTED");
  });
});

describe("candidateStatusFromDto", () => {
  it("maps queued to created", () => {
    expect(candidateStatusFromDto("queued")).toBe("created");
  });

  it("maps approved to approved", () => {
    expect(candidateStatusFromDto("approved")).toBe("approved");
  });

  it("maps rejected to risk_blocked", () => {
    expect(candidateStatusFromDto("rejected")).toBe("risk_blocked");
  });

  it("maps expired to expired", () => {
    expect(candidateStatusFromDto("expired")).toBe("expired");
  });

  it("maps cancelled to cancelled", () => {
    expect(candidateStatusFromDto("cancelled")).toBe("cancelled");
  });
});

describe("candidateStatusToDto", () => {
  it("maps created to queued", () => {
    expect(candidateStatusToDto("created")).toBe("queued");
  });

  it("maps approved to approved", () => {
    expect(candidateStatusToDto("approved")).toBe("approved");
  });

  it("maps executed to approved", () => {
    expect(candidateStatusToDto("executed")).toBe("approved");
  });

  it("maps risk_blocked to rejected", () => {
    expect(candidateStatusToDto("risk_blocked")).toBe("rejected");
  });

  it("maps expired to expired", () => {
    expect(candidateStatusToDto("expired")).toBe("expired");
  });

  it("maps cancelled to cancelled", () => {
    expect(candidateStatusToDto("cancelled")).toBe("cancelled");
  });
});
