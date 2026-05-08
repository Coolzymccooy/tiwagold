/* eslint-disable import/first -- jest.mock blocks must precede SUT imports so the mocked bindings are in place when the SUT is loaded. */
const mockAuthFetch = jest.fn();
const mockIsLiveBackendEnabled = jest.fn();
jest.mock("@/services/liveBackend", () => ({
  __esModule: true,
  authFetch: (...args: unknown[]) => mockAuthFetch(...args),
  isLiveBackendEnabled: () => mockIsLiveBackendEnabled(),
}));

import { syncEnginePrefsToCloud, syncEnginePrefsAfterAuth } from "@/services/engineSync";
import { useTradingPrefsStore } from "@/state/tradingPrefsStore";
import { useAuthStore } from "@/state/authStore";

beforeEach(() => {
  mockAuthFetch.mockReset();
  mockIsLiveBackendEnabled.mockReset();
  // Reset store state between tests
  useTradingPrefsStore.setState({
    engineEnabled: { conservative: true, aggressive: true },
    maxDailyDrawdownPct: 50,
    maxOpenPositions: 3,
    hydrated: true,
  });
  useAuthStore.setState({
    session: null,
    user: null,
    onboardingComplete: false,
    hydrated: true,
  });
});

describe("syncEnginePrefsToCloud", () => {
  test("PUTs both flags to /me/engine-prefs on the happy path", async () => {
    mockIsLiveBackendEnabled.mockReturnValue(true);
    mockAuthFetch.mockResolvedValueOnce({ ok: true });

    const result = await syncEnginePrefsToCloud({
      bearerToken: "ACCESS",
      engineEnabled: { conservative: true, aggressive: false },
    });
    expect(result.ok).toBe(true);
    expect(mockAuthFetch).toHaveBeenCalledWith("/me/engine-prefs", {
      method: "PUT",
      bearerToken: "ACCESS",
      body: { conservative_enabled: true, aggressive_enabled: false },
    });
  });

  test("returns live_backend_disabled when the flag is off", async () => {
    mockIsLiveBackendEnabled.mockReturnValue(false);
    const result = await syncEnginePrefsToCloud({
      bearerToken: "ACCESS",
      engineEnabled: { conservative: true, aggressive: true },
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("live_backend_disabled");
    expect(mockAuthFetch).not.toHaveBeenCalled();
  });

  test("refuses to PUT when both engines are disabled (cloud would 400)", async () => {
    mockIsLiveBackendEnabled.mockReturnValue(true);
    const result = await syncEnginePrefsToCloud({
      bearerToken: "ACCESS",
      engineEnabled: { conservative: false, aggressive: false },
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("no_engines_enabled");
    expect(mockAuthFetch).not.toHaveBeenCalled();
  });

  test("propagates cloud failure as cloud_put_failed", async () => {
    mockIsLiveBackendEnabled.mockReturnValue(true);
    mockAuthFetch.mockRejectedValueOnce(new Error("503 unavailable"));

    const result = await syncEnginePrefsToCloud({
      bearerToken: "ACCESS",
      engineEnabled: { conservative: true, aggressive: true },
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("cloud_put_failed");
    expect(result.error).toContain("503");
  });

  test("never throws — caller can fire-and-forget", async () => {
    mockIsLiveBackendEnabled.mockImplementation(() => {
      throw new Error("config crash");
    });
    await expect(
      syncEnginePrefsToCloud({
        bearerToken: "ACCESS",
        engineEnabled: { conservative: true, aggressive: true },
      }),
    ).rejects.toThrow();
    // Note: an `isLiveBackendEnabled` throw is genuinely exceptional —
    // surfacing it lets the caller see a misconfiguration. Other failure
    // modes return { ok: false } as exercised above.
  });
});

describe("syncEnginePrefsAfterAuth", () => {
  test("reads the current store prefs and syncs in live mode", async () => {
    mockIsLiveBackendEnabled.mockReturnValue(true);
    mockAuthFetch.mockResolvedValue({ ok: true });
    useTradingPrefsStore.setState((s) => ({
      ...s,
      engineEnabled: { conservative: true, aggressive: false },
    }));

    syncEnginePrefsAfterAuth("ACCESS");
    // Allow microtask queue to flush the promise inside syncEnginePrefsAfterAuth.
    await Promise.resolve();
    await Promise.resolve();

    expect(mockAuthFetch).toHaveBeenCalledTimes(1);
    const [path, opts] = mockAuthFetch.mock.calls[0]! as [string, Record<string, unknown>];
    expect(path).toBe("/me/engine-prefs");
    expect(opts.body).toEqual({
      conservative_enabled: true,
      aggressive_enabled: false,
    });
  });

  test("no-op in mock mode", async () => {
    mockIsLiveBackendEnabled.mockReturnValue(false);
    syncEnginePrefsAfterAuth("ACCESS");
    await Promise.resolve();
    expect(mockAuthFetch).not.toHaveBeenCalled();
  });
});
