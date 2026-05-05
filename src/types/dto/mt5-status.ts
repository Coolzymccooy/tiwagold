import { z } from "zod";

/**
 * Shape returned by persona-overseer `GET /trading/mt5-status`
 * (DASHBOARD_API_KEY-gated, sanitised — no position arrays / pending orders).
 *
 * Authoritative source:
 * persona-overseer/apps/cloud-api/src/services/trading/mt5-status.ts → sanitizeMt5Status()
 *
 * Keep this schema in sync with the backend response. Any field rename or
 * removal is a breaking change and bumps the API contract version.
 */
export const mt5StatusAccountSchema = z.object({
  number: z.string().nullable(),
  broker: z.string().nullable(),
  server: z.string().nullable(),
  balance: z.number().nullable(),
  equity: z.number().nullable(),
  openPositions: z.number().int().nonnegative(),
  connectedToBroker: z.boolean(),
});

export const mt5StatusResponseSchema = z.object({
  online: z.boolean(),
  lastHeartbeat: z.string().nullable(),
  account: mt5StatusAccountSchema.nullable(),
});

export type Mt5StatusAccountDto = z.infer<typeof mt5StatusAccountSchema>;
export type Mt5StatusResponseDto = z.infer<typeof mt5StatusResponseSchema>;

export function parseMt5StatusResponse(value: unknown): Mt5StatusResponseDto {
  return mt5StatusResponseSchema.parse(value);
}
