type ExtraShape = {
  USE_LIVE_BACKEND?: unknown;
  PERSONA_OVERSEER_BASE_URL?: unknown;
  PERSONA_OVERSEER_API_KEY?: unknown;
  PERSONA_OVERSEER_DEVICE_TOKEN?: unknown;
};

const mutableExtra: { value: ExtraShape } = { value: {} };

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return { extra: mutableExtra.value };
    },
  },
}));

const mockCoordinateRefresh = jest.fn();
jest.mock("@/state/authRefreshCoordinator", () => ({
  __esModule: true,
  coordinateRefresh: (...args: unknown[]) => mockCoordinateRefresh(...args),
  RefreshFailedError: class RefreshFailedError extends Error {},
}));

function setExtra(extra: ExtraShape): void {
  mutableExtra.value = extra;
}

afterEach(() => {
  mutableExtra.value = {};
  mockCoordinateRefresh.mockReset();
});

// eslint-disable-next-line import/first -- jest.mock above must precede the import so the mock binding is in place.
import {
  authFetch,
  isLiveBackendEnabled,
  liveFetch,
  LiveBackendDisabledError,
  LiveBackendHttpError,
  LiveBackendUnconfiguredError,
  readLiveBackendConfig,
} from "@/services/liveBackend";

describe("readLiveBackendConfig", () => {
  test("reads boolean and string fields with safe coercion", () => {
    setExtra({
      USE_LIVE_BACKEND: "true",
      PERSONA_OVERSEER_BASE_URL: "https://tiwa.tiwaton.co.uk ",
      PERSONA_OVERSEER_API_KEY: "live-key",
      PERSONA_OVERSEER_DEVICE_TOKEN: "device-abc ",
    });
    const config = readLiveBackendConfig();
    expect(config.enabled).toBe(true);
    expect(config.baseUrl).toBe("https://tiwa.tiwaton.co.uk");
    expect(config.apiKey).toBe("live-key");
    expect(config.deviceToken).toBe("device-abc");
  });

  test("treats missing fields as disabled / empty", () => {
    setExtra({
      USE_LIVE_BACKEND: false,
      PERSONA_OVERSEER_BASE_URL: "",
      PERSONA_OVERSEER_API_KEY: "",
      PERSONA_OVERSEER_DEVICE_TOKEN: "",
    });
    const config = readLiveBackendConfig();
    expect(config.enabled).toBe(false);
    expect(config.baseUrl).toBe("");
    expect(config.apiKey).toBe("");
    expect(config.deviceToken).toBe("");
  });
});

describe("isLiveBackendEnabled", () => {
  test("requires both flag on AND base URL set", () => {
    setExtra({
      USE_LIVE_BACKEND: true,
      PERSONA_OVERSEER_BASE_URL: "",
      PERSONA_OVERSEER_API_KEY: "k",
    });
    expect(isLiveBackendEnabled()).toBe(false);

    setExtra({
      USE_LIVE_BACKEND: true,
      PERSONA_OVERSEER_BASE_URL: "https://x",
      PERSONA_OVERSEER_API_KEY: "k",
    });
    expect(isLiveBackendEnabled()).toBe(true);
  });
});

describe("liveFetch", () => {
  test("throws LiveBackendDisabledError when flag is off", async () => {
    setExtra({ USE_LIVE_BACKEND: false });
    await expect(liveFetch("/trading/journal")).rejects.toBeInstanceOf(
      LiveBackendDisabledError,
    );
  });

  test("throws LiveBackendUnconfiguredError when base URL is missing", async () => {
    setExtra({
      USE_LIVE_BACKEND: true,
      PERSONA_OVERSEER_BASE_URL: "",
      PERSONA_OVERSEER_API_KEY: "k",
    });
    await expect(liveFetch("/trading/journal")).rejects.toBeInstanceOf(
      LiveBackendUnconfiguredError,
    );
  });

  test("throws LiveBackendUnconfiguredError when api key is missing", async () => {
    setExtra({
      USE_LIVE_BACKEND: true,
      PERSONA_OVERSEER_BASE_URL: "https://tiwa.test",
      PERSONA_OVERSEER_API_KEY: "",
    });
    await expect(liveFetch("/trading/journal")).rejects.toBeInstanceOf(
      LiveBackendUnconfiguredError,
    );
  });

  test("attaches x-api-key header and parses JSON body", async () => {
    setExtra({
      USE_LIVE_BACKEND: true,
      PERSONA_OVERSEER_BASE_URL: "https://tiwa.test",
      PERSONA_OVERSEER_API_KEY: "live-key",
    });
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ stats: {}, trades: [] }),
    });
    const result = await liveFetch<{ trades: unknown[] }>("/trading/journal", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result.trades).toEqual([]);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://tiwa.test/trading/journal",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ "x-api-key": "live-key" }),
      }),
    );
    const callHeaders = fetchImpl.mock.calls[0][1].headers as Record<string, string>;
    expect(callHeaders["x-tiwa-device-token"]).toBeUndefined();
  });

  test("attaches x-tiwa-device-token header when device token is configured", async () => {
    setExtra({
      USE_LIVE_BACKEND: true,
      PERSONA_OVERSEER_BASE_URL: "https://tiwa.test",
      PERSONA_OVERSEER_API_KEY: "live-key",
      PERSONA_OVERSEER_DEVICE_TOKEN: "device-abc",
    });
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    await liveFetch("/trading/mt5-status", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://tiwa.test/trading/mt5-status",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-api-key": "live-key",
          "x-tiwa-device-token": "device-abc",
        }),
      }),
    );
  });

  test("throws LiveBackendHttpError on non-2xx", async () => {
    setExtra({
      USE_LIVE_BACKEND: true,
      PERSONA_OVERSEER_BASE_URL: "https://tiwa.test",
      PERSONA_OVERSEER_API_KEY: "live-key",
    });
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({ error: "bad key" }),
    });
    await expect(
      liveFetch("/trading/journal", {
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toBeInstanceOf(LiveBackendHttpError);
  });
});

describe("authFetch", () => {
  beforeEach(() => {
    setExtra({
      USE_LIVE_BACKEND: true,
      PERSONA_OVERSEER_BASE_URL: "https://tiwa.test",
      PERSONA_OVERSEER_API_KEY: "live-key",
    });
  });

  test("does not send x-api-key or x-tiwa-device-token", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: { id: "u1" } }),
    });
    await authFetch("/users/me", {
      method: "GET",
      bearerToken: "at_1",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const headers = fetchImpl.mock.calls[0][1].headers as Record<string, string>;
    expect(headers["x-api-key"]).toBeUndefined();
    expect(headers["x-tiwa-device-token"]).toBeUndefined();
    expect(headers.authorization).toBe("Bearer at_1");
  });

  test("on 401, calls coordinateRefresh and retries with the rotated bearer token", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "expired" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ user: { id: "u1" } }),
      });
    mockCoordinateRefresh.mockResolvedValue({
      userId: "u1",
      access: {
        value: "at_new",
        tokenType: "Bearer",
        issuedAt: "2026-05-06T00:00:00Z",
        expiresAt: "2026-05-06T00:15:00Z",
      },
    });

    const result = await authFetch<{ user: { id: string } }>("/users/me", {
      method: "GET",
      bearerToken: "at_old",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(result.user.id).toBe("u1");
    expect(mockCoordinateRefresh).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const retryHeaders = fetchImpl.mock.calls[1][1].headers as Record<string, string>;
    expect(retryHeaders.authorization).toBe("Bearer at_new");
  });

  test("does not auto-refresh when no bearer token is attached (public route)", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "bad" }),
    });
    await expect(
      authFetch("/auth/sign-in", {
        method: "POST",
        body: { email: "x@y.z", password: "wrong" },
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toBeInstanceOf(LiveBackendHttpError);
    expect(mockCoordinateRefresh).not.toHaveBeenCalled();
  });

  test("propagates 401 if coordinateRefresh fails", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "expired" }),
    });
    mockCoordinateRefresh.mockRejectedValue(new Error("refresh dead"));

    await expect(
      authFetch("/users/me", {
        method: "GET",
        bearerToken: "at_old",
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toBeInstanceOf(LiveBackendHttpError);
    expect(mockCoordinateRefresh).toHaveBeenCalledTimes(1);
    // Only the original request fired; no retry after refresh failure.
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  test("skipAutoRefresh disables the loop (used internally by the refresh request itself)", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "expired" }),
    });
    await expect(
      authFetch("/auth/refresh", {
        method: "POST",
        body: { refreshToken: "rt_dead" },
        bearerToken: "at_old",
        skipAutoRefresh: true,
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toBeInstanceOf(LiveBackendHttpError);
    expect(mockCoordinateRefresh).not.toHaveBeenCalled();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
