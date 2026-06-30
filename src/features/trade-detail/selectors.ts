import type { Trade } from "@/types/trade";
import type { TradeDetailView, TradeLevelRow, TradeTimelineRow } from "./types";

const STATUS_LABELS: Record<Trade["status"], string> = {
  created: "Waiting for entry",
  approved: "Approved",
  executed: "In flight",
  expired: "Expired",
  cancelled: "Cancelled",
  risk_blocked: "Risk blocked",
};

const SESSION_LABELS: Record<Trade["sessionTag"], string> = {
  london: "London",
  new_york: "New York",
  asian: "Asian",
  off_hours: "Off hours",
};

const ENGINE_LABELS: Record<Trade["engineTier"], string> = {
  conservative: "Conservative engine",
  aggressive: "Aggressive engine",
};

export function stopDistance(trade: Trade): number {
  return Math.abs(trade.proposedEntry - trade.stopLoss);
}

export function tp1Distance(trade: Trade): number {
  return Math.abs(trade.tp1 - trade.proposedEntry);
}

export function tp2Distance(trade: Trade): number | undefined {
  if (typeof trade.tp2 !== "number") {
    return undefined;
  }
  return Math.abs(trade.tp2 - trade.proposedEntry);
}

export function riskRewardMultiple(trade: Trade): number {
  if (typeof trade.riskReward === "number" && Number.isFinite(trade.riskReward)) {
    return trade.riskReward;
  }
  const risk = stopDistance(trade);
  if (risk === 0) {
    return 0;
  }
  return tp1Distance(trade) / risk;
}

export function buildLevels(trade: Trade): TradeLevelRow[] {
  const rows: TradeLevelRow[] = [
    { label: "Entry", value: trade.proposedEntry.toFixed(2) },
    { label: "Stop", value: trade.stopLoss.toFixed(2) },
    { label: "TP1", value: trade.tp1.toFixed(2) },
  ];
  if (typeof trade.tp2 === "number") {
    rows.push({ label: "TP2", value: trade.tp2.toFixed(2) });
  }
  rows.push({ label: "R:R", value: trade.riskReward.toFixed(2) });
  rows.push({ label: "Score", value: `${trade.score}` });
  return rows;
}

export function buildTimeline(trade: Trade): TradeTimelineRow[] {
  const events = [...trade.timeline].sort(
    (a, b) => new Date(b.at).valueOf() - new Date(a.at).valueOf(),
  );
  return events.map((event, index) => ({ event, isLatest: index === 0 }));
}

export function toTradeDetailView(trade: Trade): TradeDetailView {
  const isClosed =
    trade.status === "expired" ||
    trade.status === "cancelled" ||
    Boolean(trade.autopsy);
  const isOpen = !isClosed;

  return {
    trade,
    statusLabel: STATUS_LABELS[trade.status],
    engineLabel: ENGINE_LABELS[trade.engineTier],
    sessionLabel: SESSION_LABELS[trade.sessionTag],
    levels: buildLevels(trade),
    timeline: buildTimeline(trade),
    isOpen,
    isClosed,
    canCancel: trade.status === "created" || trade.status === "approved",
    canApprove: trade.status === "created",
    // Per-user trades auto-execute via the bridge once approved — there is no
    // manual execute step, and the legacy execute path isn't wired in prod
    // (it would 503 on the placeholder intent). Never offer the execute slide.
    canExecute: false,
  };
}
