export type BrokerKindDto = "mt5" | "oanda" | "ctrader" | "paper";
export type BrokerConnectionStatusDto =
  | "disconnected"
  | "connecting"
  | "connected"
  | "degraded"
  | "error";

export interface BrokerConnectionDto {
  connection_id: string;
  kind: BrokerKindDto;
  account_label: string;
  status: BrokerConnectionStatusDto;
  connected: boolean;
  last_synced_at?: string | null;
  balance?: string | null;
  equity?: string | null;
  currency?: string | null;
  last_error_code?: string | null;
  last_error_message?: string | null;
}

export interface BrokerConnectionInputDto {
  intent_token: string;
  kind: BrokerKindDto;
  account_label: string;
  server?: string | null;
  login?: string | null;
  password?: string | null;
  api_key?: string | null;
  api_secret?: string | null;
  environment?: "demo" | "live";
}

export interface BrokerConnectionPatchDto {
  account_label?: string;
  environment?: "demo" | "live";
}

export interface BrokerConnectionTestResultDto {
  ok: boolean;
  latency_ms?: number | null;
  checked_at: string;
  error_code?: string | null;
  error_message?: string | null;
}
