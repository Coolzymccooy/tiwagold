import type {
  Trade,
  TradeDirection,
  EngineTier,
  TradeOrderRouting,
} from "@/types/trade";

export type TradeFeedFilter = "all" | "active" | "pending" | "closed";

export type TradeFeedStatus = "open" | "pending" | "closed";

export interface TradeFeedItem {
  trade: Trade;
  directionLabel: TradeDirection;
  engineTier: EngineTier;
  engineLabel: string;
  scoreLabel: string;
  riskLabel: string;
  routingLabel: TradeOrderRouting;
  sessionShortLabel: string;
  entryLabel: string;
  currentLabel: string;
  pnlUsdLabel: string | null;
  pnlRLabel: string | null;
  expectedRLabel: string | null;
  pnlTone: "positive" | "negative" | "neutral";
  status: TradeFeedStatus;
  statusLabel: string;
  isActive: boolean;
  isPending: boolean;
  isClosed: boolean;
}

export interface TradeFeedCounts {
  all: number;
  active: number;
  pending: number;
  closed: number;
}
