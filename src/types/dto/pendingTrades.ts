/**
 * Wire DTOs for the Pending Trades feed (Sprint C.3).
 *
 * Source: GET /trades/pending on persona-overseer cloud-api.
 * The cloud emits camelCase fields directly from the mt5_execution_requests
 * Drizzle table; we accept lenient parsing (snake_case fallbacks too) to
 * survive any fence-post version drift between mobile + cloud.
 */

import { z } from "zod";

const numericString = z.string().or(z.number()).transform((v) => String(v));

export const pendingTradeRowSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  direction: z.string(),
  entryType: z.string().optional(),
  entry_type: z.string().optional(),
  lotSize: numericString.optional(),
  lot_size: numericString.optional(),
  entryPrice: numericString.optional(),
  entry_price: numericString.optional(),
  stopLoss: numericString.optional(),
  stop_loss: numericString.optional(),
  takeProfit: numericString.optional(),
  take_profit: numericString.optional(),
  takeProfit2: numericString.nullable().optional(),
  take_profit_2: numericString.nullable().optional(),
  comment: z.string().optional(),
  approvalStatus: z.string().optional(),
  approval_status: z.string().optional(),
  approvalExpiresAt: z.string().nullable().optional(),
  approval_expires_at: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  created_at: z.string().optional(),
});

export type PendingTradeRow = z.infer<typeof pendingTradeRowSchema>;

export const pendingTradesResponseSchema = z.object({
  items: z.array(pendingTradeRowSchema),
});
export type PendingTradesResponse = z.infer<typeof pendingTradesResponseSchema>;

export interface PendingTrade {
  id: string;
  symbol: string;
  direction: "BUY" | "SELL";
  entryType: "LIMIT" | "MARKET";
  lotSize: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  takeProfit2: number | null;
  riskReward: number;
  comment: string;
  approvalStatus: "awaiting_approval";
  approvalExpiresAt: string | null;
  createdAt: string;
  // Engine inferred from the Tiwa- prefix on the comment ("Tiwa-aggressive", etc).
  engine: "conservative" | "aggressive" | "unknown";
}

function parseNumber(raw: unknown, fallback = 0): number {
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function pickField<T>(...candidates: (T | undefined)[]): T | undefined {
  for (const c of candidates) {
    if (c !== undefined && c !== null) return c;
  }
  return undefined;
}

function inferEngine(comment: string): PendingTrade["engine"] {
  const c = comment.toLowerCase();
  if (c.includes("aggressive")) return "aggressive";
  if (c.includes("conservative")) return "conservative";
  return "unknown";
}

export function normalizePendingTradeRow(row: PendingTradeRow): PendingTrade {
  const entry = parseNumber(pickField(row.entryPrice, row.entry_price));
  const sl = parseNumber(pickField(row.stopLoss, row.stop_loss));
  const tp = parseNumber(pickField(row.takeProfit, row.take_profit));
  const tp2Raw = pickField(row.takeProfit2, row.take_profit_2);
  const tp2 = tp2Raw == null ? null : parseNumber(tp2Raw);
  const directionRaw = String(row.direction).toUpperCase();
  const direction = directionRaw === "SELL" ? "SELL" : "BUY";
  const entryTypeRaw = pickField(row.entryType, row.entry_type) ?? "LIMIT";
  const entryType = entryTypeRaw.toUpperCase() === "MARKET" ? "MARKET" : "LIMIT";
  const comment = row.comment ?? "";
  const risk = direction === "BUY" ? entry - sl : sl - entry;
  const reward = direction === "BUY" ? tp - entry : entry - tp;
  const riskReward = risk > 0 ? Math.round((reward / risk) * 100) / 100 : 0;
  return {
    id: row.id,
    symbol: row.symbol,
    direction,
    entryType,
    lotSize: parseNumber(pickField(row.lotSize, row.lot_size)),
    entryPrice: entry,
    stopLoss: sl,
    takeProfit: tp,
    takeProfit2: tp2,
    riskReward,
    comment,
    approvalStatus: "awaiting_approval",
    approvalExpiresAt: pickField(row.approvalExpiresAt, row.approval_expires_at) ?? null,
    createdAt: pickField(row.createdAt, row.created_at) ?? new Date().toISOString(),
    engine: inferEngine(comment),
  };
}

export function parsePendingTradesResponse(raw: unknown): PendingTrade[] {
  const parsed = pendingTradesResponseSchema.parse(raw);
  return parsed.items.map(normalizePendingTradeRow);
}

export interface ApproveTradeResponse {
  id: string;
  approvalStatus: "approved" | "denied";
}

export const approveTradeResponseSchema = z.object({
  id: z.string(),
  approvalStatus: z.string(),
});
