import type {
  BrokerConnectionDto,
  BrokerConnectionInputDto,
  BrokerConnectionPatchDto,
  BrokerConnectionTestResultDto,
} from "@/types/dto";
import type {
  BrokerConnection,
  BrokerConnectionInput,
  BrokerConnectionPatch,
  BrokerConnectionTestResult,
} from "@/types/broker";

import {
  fromMoneyOrNull,
  fromOptional,
  toMoneyOrUndefined,
  toOptional,
} from "./primitives";

export function brokerConnectionFromDto(
  dto: BrokerConnectionDto,
): BrokerConnection {
  return {
    connectionId: dto.connection_id,
    kind: dto.kind,
    accountLabel: dto.account_label,
    status: dto.status,
    connected: dto.connected,
    lastSyncedAt: toOptional(dto.last_synced_at),
    balance: toMoneyOrUndefined(dto.balance),
    equity: toMoneyOrUndefined(dto.equity),
    currency: toOptional(dto.currency),
    lastErrorCode: toOptional(dto.last_error_code),
    lastErrorMessage: toOptional(dto.last_error_message),
  };
}

export function brokerConnectionToDto(
  domain: BrokerConnection,
): BrokerConnectionDto {
  return {
    connection_id: domain.connectionId,
    kind: domain.kind,
    account_label: domain.accountLabel,
    status: domain.status,
    connected: domain.connected,
    last_synced_at: fromOptional(domain.lastSyncedAt),
    balance: fromMoneyOrNull(domain.balance),
    equity: fromMoneyOrNull(domain.equity),
    currency: fromOptional(domain.currency),
    last_error_code: fromOptional(domain.lastErrorCode),
    last_error_message: fromOptional(domain.lastErrorMessage),
  };
}

export function brokerConnectionInputToDto(
  input: BrokerConnectionInput,
): BrokerConnectionInputDto {
  return {
    intent_token: input.intentToken,
    kind: input.kind,
    account_label: input.accountLabel,
    server: fromOptional(input.server),
    login: fromOptional(input.login),
    password: fromOptional(input.password),
    api_key: fromOptional(input.apiKey),
    api_secret: fromOptional(input.apiSecret),
    environment: input.environment,
  };
}

export function brokerConnectionPatchToDto(
  patch: BrokerConnectionPatch,
): BrokerConnectionPatchDto {
  return {
    account_label: patch.accountLabel,
    environment: patch.environment,
  };
}

export function brokerTestResultFromDto(
  dto: BrokerConnectionTestResultDto,
): BrokerConnectionTestResult {
  return {
    ok: dto.ok,
    latencyMs: toOptional(dto.latency_ms),
    checkedAt: dto.checked_at,
    errorCode: toOptional(dto.error_code),
    errorMessage: toOptional(dto.error_message),
  };
}
