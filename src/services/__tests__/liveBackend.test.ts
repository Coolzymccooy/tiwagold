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

function setExtra(extra: ExtraShape): void {
  mutableExtra.value = extra;
}

afterEach(() => {
  mutableExtra.value = {};
});

// eslint-disable-next-line import/first -- jest.mock above must precede the import so the mock binding is in place.
import {
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
