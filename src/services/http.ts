import {
  coordinateRefresh,
  RefreshFailedError,
  type RefreshFn,
} from "@/state/authRefreshCoordinator";
import { selectAccessToken, useAuthStore } from "@/state/authStore";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export interface HttpRequest {
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  signedIntent?: string;
  auth?: boolean;
}

interface HttpClientConfig {
  baseUrl: string;
  refreshFn: RefreshFn;
  fetchImpl?: typeof fetch;
}

export function createHttpClient(config: HttpClientConfig) {
  const fetchImpl = config.fetchImpl ?? globalThis.fetch;

  async function request<T>(req: HttpRequest): Promise<T> {
    const attempt = (retried: boolean): Promise<T> =>
      executeRequest<T>({ req, config, fetchImpl, retried });

    try {
      return await attempt(false);
    } catch (error: unknown) {
      if (error instanceof HttpError && error.status === 401 && req.auth !== false) {
        await coordinateRefresh(config.refreshFn);
        return attempt(true);
      }
      throw error;
    }
  }

  return { request };
}

async function executeRequest<T>(args: {
  req: HttpRequest;
  config: HttpClientConfig;
  fetchImpl: typeof fetch;
  retried: boolean;
}): Promise<T> {
  const { req, config, fetchImpl } = args;
  const method = req.method ?? "GET";
  const url = req.url.startsWith("http") ? req.url : `${config.baseUrl}${req.url}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(req.headers ?? {}),
  };
  if (req.body !== undefined) headers["Content-Type"] = "application/json";
  if (req.signedIntent) headers["X-Signed-Intent"] = req.signedIntent;

  if (req.auth !== false) {
    const token = selectAccessToken(useAuthStore.getState());
    if (token) headers.Authorization = `${token.tokenType} ${token.value}`;
  }

  const res = await fetchImpl(url, {
    method,
    headers,
    body: req.body === undefined ? undefined : JSON.stringify(req.body),
  });

  if (!res.ok) {
    const body = await safeJson(res);
    if (res.status === 401 && args.retried) {
      throw new RefreshFailedError("Unauthorized after refresh");
    }
    throw new HttpError(res.status, `HTTP ${res.status}`, body);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}
