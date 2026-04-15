import type { Trade } from "@/types/trade";
import type { TradeFeedFilter, TradeFeedItem } from "./types";

const ACTIVE_STATUSES: readonly Trade["status"][] = ["executed", "approved"];
const PENDING_STATUSES: readonly Trade["status"][] = ["created"];
const CLOSED_STATUSES: readonly Trade["status"][] = [
  "expired",
  "cancelled",
  "risk_blocked",
];

export function isActiveTrade(trade: Trade): boolean {
  return ACTIVE_STATUSES.includes(trade.status);
}

export function isPendingTrade(trade: Trade): boolean {
  return PENDING_STATUSES.includes(trade.status);
}

export function isClosedTrade(trade: Trade): boolean {
  return CLOSED_STATUSES.includes(trade.status);
}

function formatPnlR(value: number | undefined): string | null {
  if (value === undefined || Number.isNaN(value)) return null;
  const rounded = Math.round(value * 100) / 100;
  const sign = rounded >= 0 ? "+" : "";
  return `${sign}${rounded.toFixed(2)}R`;
}

export function toTradeFeedItem(trade: Trade): TradeFeedItem {
  return {
    trade,
    directionLabel: trade.direction,
    engineTier: trade.engineTier,
    pnlRLabel: formatPnlR(trade.currentPnlR),
    isActive: isActiveTrade(trade),
    isPending: isPendingTrade(trade),
    isClosed: isClosedTrade(trade),
  };
}

export function selectTradeFeed(
  trades: Trade[] | undefined,
  filter: TradeFeedFilter,
): TradeFeedItem[] {
  if (!trades || trades.length === 0) return [];
  const scoped = trades.filter((trade) => {
    if (filter === "active") return isActiveTrade(trade);
    if (filter === "pending") return isPendingTrade(trade);
    if (filter === "closed") return isClosedTrade(trade);
    return true;
  });
  const sorted = [...scoped].sort(
    (a, b) =>
      new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf(),
  );
  return sorted.map(toTradeFeedItem);
}
