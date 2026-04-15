import type {
  BrokerConnection,
  BrokerConnectionTestResult,
} from "@/types/broker";

export const MOCK_BROKER_CONNECTIONS: BrokerConnection[] = [
  {
    connectionId: "brk_paper_demo",
    kind: "paper",
    accountLabel: "Paper · Live-sim",
    status: "connected",
    connected: true,
    lastSyncedAt: "2026-04-14T00:55:00.000Z",
    balance: 25_000,
    equity: 25_420,
    currency: "USD",
  },
  {
    connectionId: "brk_mt5_demo_001",
    kind: "mt5",
    accountLabel: "MT5 · ICMarkets-Demo",
    status: "degraded",
    connected: true,
    lastSyncedAt: "2026-04-14T00:42:00.000Z",
    balance: 50_000,
    equity: 49_380,
    currency: "USD",
    lastErrorCode: "quote_stale",
    lastErrorMessage: "Price feed delayed by 4s",
  },
];

export const MOCK_BROKER_CONNECTION_TEST_OK: BrokerConnectionTestResult = {
  ok: true,
  latencyMs: 182,
  checkedAt: "2026-04-14T00:55:04.000Z",
};

export const MOCK_BROKER_CONNECTION_TEST_FAIL: BrokerConnectionTestResult = {
  ok: false,
  latencyMs: 1_204,
  checkedAt: "2026-04-14T00:55:04.000Z",
  errorCode: "auth_rejected",
  errorMessage: "Invalid login or investor password",
};
