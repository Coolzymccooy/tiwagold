/**
 * Risk prefs cloud sync.
 *
 * Mirrors the local `tradingPrefsStore` risk limits (maxOpenPositions,
 * maxDailyDrawdownPct) to the cloud's `user_engine_prefs` row via
 * PUT /me/risk-prefs. The cloud-side fan-out risk gate enforces these
 * server-side so a user's account can't be over-traded / traded into a
 * drawdown breach. Mobile is the source of truth; failures are silent and
 * corrected by the next change.
 */

import { useEffect } from "react";
import { authFetch, isLiveBackendEnabled } from "./liveBackend";
import { useAuthStore } from "@/state/authStore";
import { useTradingPrefsStore } from "@/state/tradingPrefsStore";

export interface SyncRiskPrefsArgs {
  bearerToken: string;
  maxOpenPositions: number;
  maxDailyDrawdownPct: number;
}

export async function syncRiskPrefsToCloud(args: SyncRiskPrefsArgs): Promise<{ ok: boolean; error?: string }> {
  if (!isLiveBackendEnabled()) return { ok: false };
  try {
    await authFetch<{ ok: boolean }>("/me/risk-prefs", {
      method: "PUT",
      bearerToken: args.bearerToken,
      body: {
        max_open_positions: args.maxOpenPositions,
        max_daily_drawdown_pct: args.maxDailyDrawdownPct,
      },
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/**
 * Mounts a subscription that pushes risk limits to the cloud whenever they
 * change, plus a one-time push on mount (so a signed-in user's persisted
 * limits reach the cloud immediately). Invoke once at the app root.
 */
export function useRiskPrefsCloudSync(): void {
  useEffect(() => {
    if (!isLiveBackendEnabled()) return;

    const access0 = useAuthStore.getState().session?.access?.value ?? null;
    if (access0) {
      const s = useTradingPrefsStore.getState();
      void syncRiskPrefsToCloud({
        bearerToken: access0,
        maxOpenPositions: s.maxOpenPositions,
        maxDailyDrawdownPct: s.maxDailyDrawdownPct,
      });
    }

    const unsubscribe = useTradingPrefsStore.subscribe((state, prev) => {
      if (
        state.maxOpenPositions === prev.maxOpenPositions &&
        state.maxDailyDrawdownPct === prev.maxDailyDrawdownPct
      ) {
        return;
      }
      const access = useAuthStore.getState().session?.access?.value ?? null;
      if (!access) return;
      void syncRiskPrefsToCloud({
        bearerToken: access,
        maxOpenPositions: state.maxOpenPositions,
        maxDailyDrawdownPct: state.maxDailyDrawdownPct,
      });
    });

    return unsubscribe;
  }, []);
}

/** One-shot push at sign-in/sign-up (mirrors the engine-prefs after-auth sync). */
export function syncRiskPrefsAfterAuth(accessToken: string): void {
  if (!isLiveBackendEnabled()) return;
  const s = useTradingPrefsStore.getState();
  syncRiskPrefsToCloud({
    bearerToken: accessToken,
    maxOpenPositions: s.maxOpenPositions,
    maxDailyDrawdownPct: s.maxDailyDrawdownPct,
  }).catch(() => {});
}
