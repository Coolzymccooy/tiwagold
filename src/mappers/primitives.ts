import type {
  SessionNameDto,
  TradeModeDto,
  TradeSideDto,
  TradeStatusDto,
  CandidateStatusDto,
} from "@/types/dto";
import type {
  SessionName,
  TradeDirection,
  TradeMode,
  TradeState,
  CandidateStatus,
} from "@/types/trade";

export function toMoney(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`mapper: cannot parse money value "${value}"`);
  }
  return parsed;
}

export function toMoneyOrUndefined(
  value: string | null | undefined,
): number | undefined {
  if (value === null || value === undefined) return undefined;
  return toMoney(value);
}

export function fromMoney(value: number, digits = 2): string {
  if (!Number.isFinite(value)) {
    throw new Error(`mapper: cannot serialize non-finite money value`);
  }
  return value.toFixed(digits);
}

export function fromMoneyOrNull(
  value: number | undefined,
  digits = 2,
): string | null {
  if (value === undefined) return null;
  return fromMoney(value, digits);
}

export function toIsoOrUndefined(
  value: string | null | undefined,
): string | undefined {
  return value ?? undefined;
}

export function fromIsoOrNull(value: string | undefined): string | null {
  return value ?? null;
}

export function toOptional<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}

export function fromOptional<T>(value: T | undefined): T | null {
  return value ?? null;
}

export function sessionFromDto(value: SessionNameDto): SessionName {
  switch (value) {
    case "asia":
      return "asian";
    case "london":
      return "london";
    case "new_york":
      return "new_york";
    case "overlap":
      return "london";
  }
}

export function sessionToDto(value: SessionName): SessionNameDto {
  switch (value) {
    case "asian":
      return "asia";
    case "london":
      return "london";
    case "new_york":
      return "new_york";
    case "off_hours":
      return "asia";
  }
}

export function sideFromDto(value: TradeSideDto): TradeDirection {
  return value === "buy" ? "BUY" : "SELL";
}

export function sideToDto(value: TradeDirection): TradeSideDto {
  return value === "BUY" ? "buy" : "sell";
}

export function modeFromDto(value: TradeModeDto): TradeMode {
  switch (value) {
    case "scalp":
    case "intraday":
      return "conservative";
    case "swing":
      return "aggressive";
  }
}

export function modeToDto(value: TradeMode): TradeModeDto {
  return value === "conservative" ? "intraday" : "swing";
}

export function tradeStateFromStatus(value: TradeStatusDto): TradeState {
  switch (value) {
    case "pending":
      return "WAIT";
    case "active":
    case "partial":
      return "TRIGGERED";
    case "filled":
      return "VALID";
    case "closed":
      return "CLOSED";
    case "cancelled":
    case "rejected":
      return "REJECTED";
  }
}

export function candidateStatusFromDto(
  value: CandidateStatusDto,
): CandidateStatus {
  switch (value) {
    case "queued":
      return "created";
    case "approved":
      return "approved";
    case "rejected":
      return "risk_blocked";
    case "expired":
      return "expired";
    case "cancelled":
      return "cancelled";
  }
}

export function candidateStatusToDto(
  value: CandidateStatus,
): CandidateStatusDto {
  switch (value) {
    case "created":
      return "queued";
    case "approved":
    case "executed":
      return "approved";
    case "risk_blocked":
      return "rejected";
    case "expired":
      return "expired";
    case "cancelled":
      return "cancelled";
  }
}
