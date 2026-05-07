import Constants from "expo-constants";
import { z } from "zod";
import type { AuthSession } from "@/types/auth";
import { coordinateRefresh } from "@/state/authRefreshCoordinator";

export class LiveBackendDisabledError extends Error {
  constructor() {
    super("Live backend is disabled (extra.USE_LIVE_BACKEND !== true)");
    this.name = "LiveBackendDisabledError";
  }
}

export class LiveBackendUnconfiguredError extends Error {
  constructor(missing: string) {
    super(`Live backend is enabled but ${missing} is not set in app.json#extra`);
    this.name = "LiveBackendUnconfiguredError";
  }
}

export class LiveBackendHttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "LiveBackendHttpError";
  }
}

export interface LiveBackendConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  deviceToken: string;
}

interface LiveBackendExtra {
  USE_LIVE_BACKEND?: unknown;
  PERSONA_OVERSEER_BASE_URL?: unknown;
  PERSONA_OVERSEER_API_KEY?: unknown;
  PERSONA_OVERSEER_DEVICE_TOKEN?: unknown;
}

function readExtra(): LiveBackendExtra {
  const extra = Constants.expoConfig?.extra ?? {};
  return extra as LiveBackendExtra;
}

function readBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
}

function readString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function readLiveBackendConfig(): LiveBackendConfig {
  const extra = readExtra();
  return {
    enabled: readBoolean(extra.USE_LIVE_BACKEND),
    baseUrl: readString(extra.PERSONA_OVERSEER_BASE_URL),
    apiKey: readString(extra.PERSONA_OVERSEER_API_KEY),
    deviceToken: readString(extra.PERSONA_OVERSEER_DEVICE_TOKEN),
  };
}

export function isLiveBackendEnabled(): boolean {
  const config = readLiveBackendConfig();
  return config.enabled && config.baseUrl.length > 0;
}

export interface LiveFetchOptions {
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}

export async function liveFetch<T>(
  path: string,
  options: LiveFetchOptions = {},
): Promise<T> {
  const config = readLiveBackendConfig();
  if (!config.enabled) throw new LiveBackendDisabledError();
  if (!config.baseUrl) throw new LiveBackendUnconfiguredError("PERSONA_OVERSEER_BASE_URL");
  if (!config.apiKey) throw new LiveBackendUnconfiguredError("PERSONA_OVERSEER_API_KEY");

  const url = path.startsWith("http") ? path : `${config.baseUrl}${path}`;
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const headers: Record<string, string> = {
    accept: "application/json",
    "x-api-key": config.apiKey,
  };
  if (config.deviceToken.length > 0) {
    headers["x-tiwa-device-token"] = config.deviceToken;
  }
  const response = await fetchImpl(url, {
    method: "GET",
    headers,
    signal: options.signal,
  });

  if (!response.ok) {
    const body = await safeJson(response);
    throw new LiveBackendHttpError(
      response.status,
      `Live backend ${response.status} on ${path}`,
      body,
    );
  }

  return (await response.json()) as T;
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}

export interface AuthFetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  bearerToken?: string | null;
  /**
   * Extra request headers (e.g. `X-Intent: <jwt>` for the signed-intent
   * approve/deny endpoints). Merged on top of the defaults; the auth + content
   * headers cannot be overridden through this map.
   */
  extraHeaders?: Record<string, string>;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
  /**
   * Internal flag — when true, a 401 response will NOT trigger an auto-refresh
   * + retry. Used to break the recursion when the refresh request itself is
   * a 401 (refresh token also dead). Callers should leave this undefined.
   */
  skipAutoRefresh?: boolean;
}

/**
 * Auth-realm fetch. Hits the same `PERSONA_OVERSEER_BASE_URL` host but does
 * NOT send `x-api-key` or `x-tiwa-device-token` — those gate /trading/*
 * (Path B). Auth routes are public; /users/me uses a Bearer access token.
 *
 * On a 401 response with a bearer token attached, this transparently:
 *   1. Calls the refresh-token coordinator (single-flight).
 *   2. Retries the request once with the rotated access token.
 *   3. If the refresh fails, propagates the original 401 and signs out.
 *
 * Set `skipAutoRefresh: true` on internal callers to disable the loop (the
 * `/auth/refresh` request itself uses this internally).
 */
export async function authFetch<T>(
  path: string,
  options: AuthFetchOptions = {},
): Promise<T> {
  const config = readLiveBackendConfig();
  if (!config.enabled) throw new LiveBackendDisabledError();
  if (!config.baseUrl) throw new LiveBackendUnconfiguredError("PERSONA_OVERSEER_BASE_URL");

  const url = path.startsWith("http") ? path : `${config.baseUrl}${path}`;
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const method = options.method ?? "GET";
  const headers: Record<string, string> = { accept: "application/json" };
  if (options.body !== undefined) {
    headers["content-type"] = "application/json";
  }
  if (options.bearerToken && options.bearerToken.length > 0) {
    headers.authorization = `Bearer ${options.bearerToken}`;
  }
  if (options.extraHeaders) {
    for (const [k, v] of Object.entries(options.extraHeaders)) {
      // Don't allow overriding auth/content headers from extras.
      const lower = k.toLowerCase();
      if (lower === "authorization" || lower === "content-type" || lower === "accept") {
        continue;
      }
      headers[k] = v;
    }
  }

  const response = await fetchImpl(url, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (
    response.status === 401 &&
    !options.skipAutoRefresh &&
    options.bearerToken &&
    options.bearerToken.length > 0
  ) {
    const refreshedAccessToken = await tryRefreshAccessToken(fetchImpl);
    if (refreshedAccessToken) {
      return authFetch<T>(path, {
        ...options,
        bearerToken: refreshedAccessToken,
        skipAutoRefresh: true,
      });
    }
    // Refresh failed; fall through to the standard 401 error below.
  }

  if (!response.ok) {
    const body = await safeJson(response);
    throw new LiveBackendHttpError(
      response.status,
      `Auth backend ${response.status} on ${path}`,
      body,
    );
  }

  return (await response.json()) as T;
}

const refreshSessionResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    displayName: z.string(),
    tier: z.enum(["trial", "pro", "founder"]),
    createdAt: z.string(),
  }),
  accessToken: z.string(),
  accessTokenExpiresAt: z.string(),
  refreshToken: z.string().optional(),
  refreshTokenExpiresAt: z.string().optional(),
});

async function tryRefreshAccessToken(
  fetchImpl: typeof fetch,
): Promise<string | null> {
  try {
    const session = await coordinateRefresh(async (refreshToken) => {
      const raw = await authFetch<unknown>("/auth/refresh", {
        method: "POST",
        body: { refreshToken },
        fetchImpl,
        skipAutoRefresh: true,
      });
      const parsed = refreshSessionResponseSchema.parse(raw);
      const issuedAt = new Date().toISOString();
      const next: AuthSession = {
        userId: parsed.user.id,
        access: {
          value: parsed.accessToken,
          tokenType: "Bearer",
          issuedAt,
          expiresAt: parsed.accessTokenExpiresAt,
        },
      };
      if (parsed.refreshToken && parsed.refreshTokenExpiresAt) {
        next.refresh = {
          value: parsed.refreshToken,
          issuedAt,
          expiresAt: parsed.refreshTokenExpiresAt,
        };
      }
      return next;
    });
    return session.access.value;
  } catch {
    // coordinateRefresh signs out on failure; surface null so the caller
    // throws the original 401 to the screen.
    return null;
  }
}
