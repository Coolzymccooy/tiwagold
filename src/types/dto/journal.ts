import { z } from "zod";

/**
 * Shape returned by persona-overseer `GET /trading/journal`.
 * See: persona-overseer/apps/cloud-api/src/services/trading/tradingview-webhook.ts
 *
 * Authoritative source — keep this in sync when the backend route shape changes.
 */

export const journalExecutionStateSchema = z.enum([
  "awaiting_placement",
  "placed",
  "filled",
  "closed",
]);

export const journalTradeRowSchema = z.object({
  id: z.string(),
  direction: z.enum(["BUY", "SELL"]),
  // Source of truth for engineTier on the mobile side; falls back to
  // substring inference on setupType when the cloud doesn't surface it
  // (legacy rows / older deploys). Backend default is 'conservative'.
  mode: z.enum(["conservative", "aggressive"]).optional(),
  setupType: z.string().nullable().optional(),
  state: z.string(),
  executionState: journalExecutionStateSchema.optional(),
  brokerTicket: z.string().nullable().optional(),
  session: z.string().nullable().optional(),
  entry: z.number(),
  actualEntry: z.number().nullable().optional(),
  stopLoss: z.number(),
  tp1: z.number(),
  tp2: z.number(),
  rr: z.number(),
  setupScore: z.number().nullable().optional(),
  result: z.enum(["WIN", "LOSS", "BE", "EXPIRED"]).nullable().optional(),
  rMultiple: z.number().nullable().optional(),
  createdAt: z.string(),
  closedAt: z.string().nullable().optional(),
});

export const journalEquityPointSchema = z.object({
  date: z.string(),
  r: z.number(),
});

export const journalSessionBreakdownEntrySchema = z.object({
  wins: z.number(),
  losses: z.number(),
  total: z.number(),
});

export const journalSetupBreakdownEntrySchema = z.object({
  wins: z.number(),
  losses: z.number(),
  total: z.number(),
  avgR: z.number(),
});

export const journalStatsSchema = z
  .object({
    totalTrades: z.number().optional(),
    winRate: z.number().optional(),
    avgR: z.number().optional(),
    totalR: z.number().optional(),
    bestR: z.number().optional(),
    worstR: z.number().optional(),
    expectancy: z.number().optional(),
  })
  .passthrough();

export const journalDtoSchema = z.object({
  stats: journalStatsSchema,
  trades: z.array(journalTradeRowSchema),
  openTrades: z.number(),
  equityCurve: z.array(journalEquityPointSchema),
  sessionBreakdown: z.record(journalSessionBreakdownEntrySchema),
  setupBreakdown: z.record(journalSetupBreakdownEntrySchema),
  evaluationActivity: z.unknown().optional(),
  ruleBreaks: z.number().optional(),
});

export type JournalExecutionStateDto = z.infer<typeof journalExecutionStateSchema>;
export type JournalTradeRowDto = z.infer<typeof journalTradeRowSchema>;
export type JournalEquityPointDto = z.infer<typeof journalEquityPointSchema>;
export type JournalSessionBreakdownEntryDto = z.infer<
  typeof journalSessionBreakdownEntrySchema
>;
export type JournalSetupBreakdownEntryDto = z.infer<
  typeof journalSetupBreakdownEntrySchema
>;
export type JournalStatsDto = z.infer<typeof journalStatsSchema>;
export type JournalDto = z.infer<typeof journalDtoSchema>;

export function parseJournalDto(value: unknown): JournalDto {
  return journalDtoSchema.parse(value);
}
