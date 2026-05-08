/**
 * Expo push token lifecycle — Phase N1.
 *
 *   ensurePushPermission()        — asks the OS for notification permission
 *   getExpoPushToken()             — fetches the device's ExponentPushToken
 *   registerExpoPushTokenWithCloud — PUT /me/expo-push-token
 *   clearExpoPushTokenFromCloud    — PUT /me/expo-push-token { token: null }
 *
 * All four are imperative and resilient: they never throw to the caller.
 * Failures log + return `{ ok: false, reason }` so the auth flow keeps moving
 * even when the user denies permission, the device is offline, or the cloud
 * /me/* endpoint is unreachable. Push delivery is best-effort — the mobile
 * pending list polls every 15s as a fallback discovery channel.
 */

import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { authFetch } from "./liveBackend";

export type RegisterReason =
  | "permission_denied"
  | "no_project_id"
  | "fetch_token_failed"
  | "cloud_register_failed";

export interface RegisterResult {
  ok: boolean;
  token?: string;
  reason?: RegisterReason;
  error?: string;
}

interface ExpoExtra {
  eas?: { projectId?: unknown };
}

function readProjectId(): string | null {
  const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;
  const id = extra.eas?.projectId;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export async function ensurePushPermission(): Promise<boolean> {
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return true;
    if (!existing.canAskAgain) return false;
    const next = await Notifications.requestPermissionsAsync();
    return Boolean(next.granted);
  } catch {
    return false;
  }
}

export async function getExpoPushToken(): Promise<string | null> {
  const projectId = readProjectId();
  if (!projectId) return null;
  try {
    const result = await Notifications.getExpoPushTokenAsync({ projectId });
    return typeof result.data === "string" && result.data.length > 0
      ? result.data
      : null;
  } catch {
    return null;
  }
}

export async function registerExpoPushTokenWithCloud(args: {
  bearerToken: string;
}): Promise<RegisterResult> {
  const granted = await ensurePushPermission();
  if (!granted) {
    return { ok: false, reason: "permission_denied" };
  }

  if (!readProjectId()) {
    return { ok: false, reason: "no_project_id" };
  }

  const token = await getExpoPushToken();
  if (!token) {
    return { ok: false, reason: "fetch_token_failed" };
  }

  try {
    await authFetch<{ ok: boolean }>("/me/expo-push-token", {
      method: "PUT",
      bearerToken: args.bearerToken,
      body: { token },
    });
    return { ok: true, token };
  } catch (err) {
    return {
      ok: false,
      reason: "cloud_register_failed",
      error: (err as Error).message,
    };
  }
}

export async function clearExpoPushTokenFromCloud(args: {
  bearerToken: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await authFetch<{ ok: boolean }>("/me/expo-push-token", {
      method: "PUT",
      bearerToken: args.bearerToken,
      body: { token: null },
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
