import {
  parseMt5StatusResponse,
  type Mt5StatusResponseDto,
} from "@/types/dto/mt5-status";

describe("parseMt5StatusResponse", () => {
  test("parses the canonical online shape", () => {
    const dto: Mt5StatusResponseDto = {
      online: true,
      lastHeartbeat: "2026-05-05T08:00:00.000Z",
      account: {
        number: "1234567",
        broker: "ICMarkets",
        server: "ICMarketsSC-Demo",
        balance: 10_000,
        equity: 9_945.5,
        openPositions: 1,
        connectedToBroker: true,
      },
    };
    expect(parseMt5StatusResponse(dto)).toEqual(dto);
  });

  test("parses the offline / no-account shape", () => {
    const dto = {
      online: false,
      lastHeartbeat: null,
      account: null,
    };
    expect(parseMt5StatusResponse(dto)).toEqual(dto);
  });

  test("rejects payloads with missing online flag", () => {
    expect(() =>
      parseMt5StatusResponse({ lastHeartbeat: null, account: null }),
    ).toThrow();
  });

  test("rejects payloads where openPositions is negative", () => {
    expect(() =>
      parseMt5StatusResponse({
        online: true,
        lastHeartbeat: "2026-05-05T08:00:00.000Z",
        account: {
          number: "1",
          broker: "B",
          server: "S",
          balance: 0,
          equity: 0,
          openPositions: -1,
          connectedToBroker: false,
        },
      }),
    ).toThrow();
  });

  test("rejects payloads where openPositions is non-integer", () => {
    expect(() =>
      parseMt5StatusResponse({
        online: true,
        lastHeartbeat: null,
        account: {
          number: null,
          broker: null,
          server: null,
          balance: null,
          equity: null,
          openPositions: 1.5,
          connectedToBroker: true,
        },
      }),
    ).toThrow();
  });

  test("rejects payloads with extra unsanitised fields silently dropped", () => {
    // Zod by default strips unknown fields rather than failing — that is fine
    // for forwards-compat. Confirm sensitive leak fields don't survive parsing.
    const parsed = parseMt5StatusResponse({
      online: true,
      lastHeartbeat: null,
      account: null,
      positions: [{ ticket: "999" }],
      pendingOrders: [{ ticket: "888" }],
    });
    expect(parsed).not.toHaveProperty("positions");
    expect(parsed).not.toHaveProperty("pendingOrders");
  });
});
