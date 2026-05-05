import type { EngineTier, SessionName, Trade, TradeOrderRouting } from "@/types/trade";
import type { TradeFeedCounts, TradeFeedFilter, TradeFeedItem, TradeFeedStatus } from "./types";

const ACTIVE_STATUSES: readonly Trade["status"][] = ["executed", "approved"];
const PENDING_STATUSES: readonly Trade["status"][] = ["created"];
const CLOSED_STATUSES: readonly Trade["status"][] = [
  "expired",
  "cancelled",
  "risk_blocked",
];

const ENGINE_LABEL: Record<EngineTier, string> = {
  conservative: "Conservative",
  aggressive: "Aggressive",
};

const SESSION_SHORT: Record<SessionName, string> = {
  london: "LONDON",
  new_york: "NY",
  asian: "ASIAN",
  off_hours: "OFF",
};

export function isActiveTrade(trade: Trade): boolean {
  return ACTIVE_STATUSES.includes(trade.status);
}

export function isPendingTrade(trade: Trade): boolean {
  return PENDING_STATUSES.includes(trade.status);
}

export function isClosedTrade(trade: Trade): boolean {
  if (CLOSED_STATUSES.includes(trade.status)) return true;
  return Boolean(trade.autopsy);
}

function resolveStatus(trade: Trade): TradeFeedStatus {
  if (isClosedTrade(trade)) return "closed";
  if (isPendingTrade(trade)) return "pending";
  return "open";
}

function formatPrice(value: number | undefined | null): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return value.toFixed(2);
}

function formatPnlR(value: number | undefined): string | null {
  if (value === undefined || Number.isNaN(value)) return null;
  const rounded = Math.round(value * 100) / 100;
  const sign = rounded >= 0 ? "+" : "";
  return `${sign}${rounded.toFixed(2)}R`;
}

function formatPnlUsd(value: number | undefined): string | null {
  if (value === undefined || Number.isNaN(value)) return null;
  const rounded = Math.round(value * 100) / 100;
  const sign = rounded >= 0 ? "+" : "";
  return `${sign}${rounded.toFixed(2)}`;
}

function formatExpectedR(value: number | undefined): string | null {
  if (value === undefined || Number.isNaN(value)) return null;
  return `${value.toFixed(1)}R`;
}

function formatRisk(value: number | undefined): string {
  const pct = typeof value === "number" ? value : 1;
  const rounded = Math.round(pct * 10) / 10;
  return `RISK ${rounded}%`;
}

function resolveRouting(trade: Trade): TradeOrderRouting {
  if (trade.orderRouting) return trade.orderRouting;
  return trade.status === "executed" ? "MARKET" : "LIMIT";
}

function resolvePnlTone(
  status: TradeFeedStatus,
  pnlUsd: number | undefined,
): "positive" | "negative" | "neutral" {
  if (status === "pending") return "neutral";
  if (typeof pnlUsd !== "number" || Number.isNaN(pnlUsd)) return "neutral";
  if (pnlUsd > 0) return "positive";
  if (pnlUsd < 0) return "negative";
  return "neutral";
}

function resolveStatusLabel(status: TradeFeedStatus): string {
  if (status === "open") return "OPEN";
  if (status === "pending") return "PENDING";
  return "CLOSED";
}

export function toTradeFeedItem(trade: Trade): TradeFeedItem {
  const status = resolveStatus(trade);
  const isPending = status === "pending";
  return {
    trade,
    directionLabel: trade.direction,
    engineTier: trade.engineTier,
    engineLabel: ENGINE_LABEL[trade.engineTier],
    scoreLabel: `${trade.score}/100`,
    riskLabel: formatRisk(trade.riskPercent),
    routingLabel: resolveRouting(trade),
    sessionShortLabel: SESSION_SHORT[trade.sessionTag],
    entryLabel: formatPrice(trade.proposedEntry),
    currentLabel: formatPrice(trade.currentPrice ?? trade.actualEntry),
    pnlUsdLabel: isPending ? null : formatPnlUsd(trade.currentPnlUsd),
    pnlRLabel: isPending ? null : formatPnlR(trade.currentPnlR),
    expectedRLabel: isPending ? formatExpectedR(trade.riskReward) : null,
    pnlTone: resolvePnlTone(status, trade.currentPnlUsd),
    status,
    statusLabel: resolveStatusLabel(status),
    isActive: status === "open",
    isPending: status === "pending",
    isClosed: status === "closed",
  };
}

export function selectTradeFeed(
  trades: Trade[] | undefined,
  filter: TradeFeedFilter,
  engineEnabled?: Record<EngineTier, boolean>,
): TradeFeedItem[] {
  if (!trades || trades.length === 0) return [];
  const items = trades.map(toTradeFeedItem);
  const scoped = items.filter((item) => {
    if (engineEnabled && engineEnabled[item.engineTier] === false) {
      return false;
    }
    if (filter === "active") return item.isActive;
    if (filter === "pending") return item.isPending;
    if (filter === "closed") return item.isClosed;
    return true;
  });
  return [...scoped].sort(
    (a, b) =>
      new Date(b.trade.updatedAt).valueOf() -
      new Date(a.trade.updatedAt).valueOf(),
  );
}

export function selectTradeFeedCounts(
  trades: Trade[] | undefined,
): TradeFeedCounts {
  if (!trades || trades.length === 0) {
    return { all: 0, active: 0, pending: 0, closed: 0 };
  }
  let active = 0;
  let pending = 0;
  let closed = 0;
  for (const trade of trades) {
    if (isClosedTrade(trade)) closed += 1;
    else if (isPendingTrade(trade)) pending += 1;
    else if (isActiveTrade(trade)) active += 1;
  }
  return { all: trades.length, active, pending, closed };
}

export function selectLivePortfolioPnlUsd(
  trades: Trade[] | undefined,
): number {
  if (!trades || trades.length === 0) return 0;
  return trades.reduce((sum, trade) => {
    if (typeof trade.currentPnlUsd !== "number") return sum;
    return sum + trade.currentPnlUsd;
  }, 0);
}
