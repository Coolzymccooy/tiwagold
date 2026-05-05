import Constants from "expo-constants";

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
