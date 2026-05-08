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

interface CloudEnginePrefsResponse {
  conservative_enabled: boolean;
  aggressive_enabled: boolean;
  updated_at: string | null;
}

export type HydrateReason =
  | "live_backend_disabled"
  | "no_cloud_row"
  | "cloud_get_failed";

export interface HydrateResult {
  ok: boolean;
  reason?: HydrateReason;
  conservative?: boolean;
  aggressive?: boolean;
}

/**
 * Cross-device hydration — Phase Q.
 *
 * On sign-in, fetch the cloud-side prefs. If the user has a real row
 * (updated_at !== null), overwrite the local Zustand store so a fresh
 * device install respects the user's last choice instead of clobbering it
 * with the default "both engines on". When the cloud has no row yet
 * (new account on this account ID), leave the local store alone — the
 * subsequent syncEnginePrefsAfterAuth call will INSERT it.
 *
 * Failures are silent — the existing syncEnginePrefsAfterAuth path runs
 * regardless, so a hydration miss just means the local state wins.
 */
export async function hydrateEnginePrefsFromCloud(args: {
  bearerToken: string;
}): Promise<HydrateResult> {
  if (!isLiveBackendEnabled()) {
    return { ok: false, reason: "live_backend_disabled" };
  }
  let raw: CloudEnginePrefsResponse;
  try {
    raw = await authFetch<CloudEnginePrefsResponse>("/me/engine-prefs", {
      method: "GET",
      bearerToken: args.bearerToken,
    });
  } catch {
    return { ok: false, reason: "cloud_get_failed" };
  }
  if (raw.updated_at === null) {
    return { ok: false, reason: "no_cloud_row" };
  }
  const cons = Boolean(raw.conservative_enabled);
  const agg = Boolean(raw.aggressive_enabled);
  // Defensive: don't write an "all-engines-off" state into local store —
  // cloud rejects that on PUT, so a row with both=false would be data corruption.
  // Skip the write and fall through to the regular push.
  if (!cons && !agg) {
    return { ok: false, reason: "no_cloud_row" };
  }
  useTradingPrefsStore.getState().setEngineEnabled("conservative", cons);
  useTradingPrefsStore.getState().setEngineEnabled("aggressive", agg);
  return { ok: true, conservative: cons, aggressive: agg };
}

/**
 * Hydrate-then-sync helper for the sign-in / sign-up onSuccess hook.
 * Awaits the GET so any cloud-side row overwrites the local store BEFORE
 * the push runs (otherwise we'd push the stale local state and clobber
 * the cloud).
 */
export async function reconcileEnginePrefsAfterAuth(
  accessToken: string,
): Promise<void> {
  await hydrateEnginePrefsFromCloud({ bearerToken: accessToken });
  // After hydration, push the now-current local state back. If hydration
  // succeeded the values match (no-op write); if it failed, we're back to
  // the pre-Phase-Q behaviour of pushing local-as-truth.
  syncEnginePrefsAfterAuth(accessToken);
}
