import type { Trade, TradeTimelineEvent } from "@/types/trade";

export interface TradeLevelRow {
  label: string;
  value: string;
}

export interface TradeTimelineRow {
  event: TradeTimelineEvent;
  isLatest: boolean;
}

export interface TradeDetailView {
  trade: Trade;
  statusLabel: string;
  engineLabel: string;
  sessionLabel: string;
  levels: TradeLevelRow[];
  timeline: TradeTimelineRow[];
  isOpen: boolean;
  isClosed: boolean;
  canCancel: boolean;
  canApprove: boolean;
  canExecute: boolean;
}
