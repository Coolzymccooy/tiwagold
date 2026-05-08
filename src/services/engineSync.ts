/**
 * Engine prefs cloud sync — Phase N2.
 *
 * Mirrors the local `tradingPrefsStore.engineEnabled` to the cloud's
 * `user_engine_prefs` table via PUT /me/engine-prefs. The cloud-side
 * `gold-monitor` fan-out reads that row to decide whether to enqueue an
 * `awaiting_approval` execution_request for this user when a signal fires.
 *
 * Mobile is the source of truth; the cloud just reflects its last push.
 * Failures are silent — a dropped sync is corrected by the next toggle.
 */

import { useEffect } from "react";
import { authFetch, isLiveBackendEnabled } from "./liveBackend";
import { useAuthStore } from "@/state/authStore";
import { useTradingPrefsStore } from "@/state/tradingPrefsStore";
import type { EngineTier } from "@/types/trade";

export interface SyncEnginePrefsArgs {
  bearerToken: string;
  engineEnabled: Record<EngineTier, boolean>;
}

export type SyncReason =
  | "no_engines_enabled"
  | "live_backend_disabled"
  | "cloud_put_failed";

export interface SyncResult {
  ok: boolean;
  reason?: SyncReason;
  error?: string;
}

export async function syncEnginePrefsToCloud(
  args: SyncEnginePrefsArgs,
): Promise<SyncResult> {
  if (!isLiveBackendEnabled()) {
    return { ok: false, reason: "live_backend_disabled" };
  }
  const cons = args.engineEnabled.conservative;
  const agg = args.engineEnabled.aggressive;
  // The cloud rejects "no engines enabled" with HTTP 400 to keep users from
  // becoming silent (no signals would ever fan out). Mobile UI already
  // prevents this; we short-circuit here so we never even attempt the PUT.
  if (!cons && !agg) {
    return { ok: false, reason: "no_engines_enabled" };
  }
  try {
    await authFetch<{ ok: boolean }>("/me/engine-prefs", {
      method: "PUT",
      bearerToken: args.bearerToken,
      body: {
        conservative_enabled: cons,
        aggressive_enabled: agg,
      },
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: "cloud_put_failed",
      error: (err as Error).message,
    };
  }
}

/**
 * Mounts a Zustand subscription that pushes `engineEnabled` to the cloud
 * whenever it changes. Designed to be invoked once at the app root (e.g.
 * `app/_layout.tsx`). No-op when the user isn't signed in or the live
 * backend is disabled.
 *
 * Initial mount also fires a one-time sync so a user signing in on a fresh
 * device pushes their persisted state up immediately.
 */
export function useEnginePrefsCloudSync(): void {
  useEffect(() => {
    if (!isLiveBackendEnabled()) return;

    const initialAccess = useAuthStore.getState().session?.access?.value ?? null;
    if (initialAccess) {
      const initialPrefs = useTradingPrefsStore.getState().engineEnabled;
      void syncEnginePrefsToCloud({
        bearerToken: initialAccess,
        engineEnabled: initialPrefs,
      });
    }

    const unsubscribe = useTradingPrefsStore.subscribe((state, prev) => {
      if (
        state.engineEnabled.conservative === prev.engineEnabled.conservative &&
        state.engineEnabled.aggressive === prev.engineEnabled.aggressive
      ) {
        return;
      }
      const access = useAuthStore.getState().session?.access?.value ?? null;
      if (!access) return;
      void syncEnginePrefsToCloud({
        bearerToken: access,
        engineEnabled: state.engineEnabled,
      });
    });

    return unsubscribe;
  }, []);
}

/**
 * One-shot sync used by sign-in / sign-up `onSuccess` so the cloud picks up
 * the user's persisted prefs (or default `both engines on`) at session
 * boundary, without waiting for a toggle.
 */
export function syncEnginePrefsAfterAuth(accessToken: string): void {
  if (!isLiveBackendEnabled()) return;
  const prefs = useTradingPrefsStore.getState().engineEnabled;
  syncEnginePrefsToCloud({
    bearerToken: accessToken,
    engineEnabled: prefs,
  }).catch(() => {
    // syncEnginePrefsToCloud already returns { ok:false } on failure;
    // belt-and-braces .catch in case a future change throws.
  });
}
