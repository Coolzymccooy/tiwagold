export type BrokerKind = "mt5" | "oanda" | "ctrader" | "paper";

export type BrokerConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "degraded"
  | "error";

export interface BrokerConnection {
  connectionId: string;
  kind: BrokerKind;
  accountLabel: string;
  status: BrokerConnectionStatus;
  connected: boolean;
  lastSyncedAt?: string;
  balance?: number;
  equity?: number;
  currency?: string;
  lastErrorCode?: string;
  lastErrorMessage?: string;
}

export interface BrokerConnectionInput {
  intentToken: string;
  kind: BrokerKind;
  accountLabel: string;
  server?: string;
  login?: string;
  password?: string;
  apiKey?: string;
  apiSecret?: string;
  environment?: "demo" | "live";
}

export interface BrokerConnectionPatch {
  accountLabel?: string;
  environment?: "demo" | "live";
}

export interface BrokerConnectionTestResult {
  ok: boolean;
  latencyMs?: number;
  checkedAt: string;
  errorCode?: string;
  errorMessage?: string;
}
