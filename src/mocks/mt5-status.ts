import type { Mt5StatusResponseDto } from "@/types/dto/mt5-status";

export const MOCK_MT5_STATUS_OFFLINE: Mt5StatusResponseDto = {
  online: false,
  lastHeartbeat: null,
  account: null,
};

export const MOCK_MT5_STATUS_ONLINE: Mt5StatusResponseDto = {
  online: true,
  lastHeartbeat: "2026-05-05T00:25:00.000Z",
  account: {
    number: "10042781",
    broker: "ICMarkets",
    server: "ICMarketsSC-Demo",
    balance: 10_000,
    equity: 9_945.5,
    openPositions: 1,
    connectedToBroker: true,
  },
};
