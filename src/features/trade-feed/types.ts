import type { Trade, TradeDirection, EngineTier } from "@/types/trade";

export type TradeFeedFilter = "all" | "active" | "pending" | "closed";

export interface TradeFeedItem {
  trade: Trade;
  directionLabel: TradeDirection;
  engineTier: EngineTier;
  pnlRLabel: string | null;
  isActive: boolean;
  isPending: boolean;
  isClosed: boolean;
}
