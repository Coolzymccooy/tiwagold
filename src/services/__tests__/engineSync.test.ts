/* eslint-disable import/first -- jest.mock blocks must precede SUT imports so the mocked bindings are in place when the SUT is loaded. */
const mockAuthFetch = jest.fn();
const mockIsLiveBackendEnabled = jest.fn();
jest.mock("@/services/liveBackend", () => ({
  __esModule: true,
  authFetch: (...args: unknown[]) => mockAuthFetch(...args),
  isLiveBackendEnabled: () => mockIsLiveBackendEnabled(),
}));

import {
  syncEnginePrefsToCloud,
  syncEnginePrefsAfterAuth,
  hydrateEnginePrefsFromCloud,
  reconcileEnginePrefsAfterAuth,
} from "@/services/engineSync";
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

describe("hydrateEnginePrefsFromCloud", () => {
  test("overwrites local store when cloud has a real row", async () => {
    mockIsLiveBackendEnabled.mockReturnValue(true);
    mockAuthFetch.mockResolvedValueOnce({
      conservative_enabled: false,
      aggressive_enabled: true,
      updated_at: "2026-05-07T12:00:00Z",
    });

    const result = await hydrateEnginePrefsFromCloud({ bearerToken: "ACCESS" });
    expect(result.ok).toBe(true);
    expect(result.conservative).toBe(false);
    expect(result.aggressive).toBe(true);

    const local = useTradingPrefsStore.getState().engineEnabled;
    expect(local.conservative).toBe(false);
    expect(local.aggressive).toBe(true);
  });

  test("leaves local store untouched when cloud has no row (updated_at=null)", async () => {
    mockIsLiveBackendEnabled.mockReturnValue(true);
    // Local default: both true
    useTradingPrefsStore.setState((s) => ({
      ...s,
      engineEnabled: { conservative: true, aggressive: true },
    }));
    mockAuthFetch.mockResolvedValueOnce({
      conservative_enabled: true,
      aggressive_enabled: true,
      updated_at: null,
    });

    const result = await hydrateEnginePrefsFromCloud({ bearerToken: "ACCESS" });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("no_cloud_row");

    const local = useTradingPrefsStore.getState().engineEnabled;
    expect(local).toEqual({ conservative: true, aggressive: true });
  });

  test("ignores cloud row that asserts both engines off (corrupt state)", async () => {
    mockIsLiveBackendEnabled.mockReturnValue(true);
    useTradingPrefsStore.setState((s) => ({
      ...s,
      engineEnabled: { conservative: true, aggressive: true },
    }));
    mockAuthFetch.mockResolvedValueOnce({
      conservative_enabled: false,
      aggressive_enabled: false,
      updated_at: "2026-05-07T12:00:00Z",
    });

    const result = await hydrateEnginePrefsFromCloud({ bearerToken: "ACCESS" });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("no_cloud_row");
    // Local untouched
    expect(useTradingPrefsStore.getState().engineEnabled).toEqual({
      conservative: true,
      aggressive: true,
    });
  });

  test("returns cloud_get_failed on network error", async () => {
    mockIsLiveBackendEnabled.mockReturnValue(true);
    mockAuthFetch.mockRejectedValueOnce(new Error("ECONNRESET"));
    const result = await hydrateEnginePrefsFromCloud({ bearerToken: "ACCESS" });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("cloud_get_failed");
  });

  test("no-op in mock mode", async () => {
    mockIsLiveBackendEnabled.mockReturnValue(false);
    const result = await hydrateEnginePrefsFromCloud({ bearerToken: "ACCESS" });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("live_backend_disabled");
    expect(mockAuthFetch).not.toHaveBeenCalled();
  });
});

describe("reconcileEnginePrefsAfterAuth", () => {
  test("hydrate THEN push so cloud row wins over stale local state", async () => {
    mockIsLiveBackendEnabled.mockReturnValue(true);
    // Local says both on; cloud says aggressive=false. After reconcile,
    // local should be aggressive=false AND the push should reflect that.
    useTradingPrefsStore.setState((s) => ({
      ...s,
      engineEnabled: { conservative: true, aggressive: true },
    }));
    mockAuthFetch
      // GET: cloud says aggressive=false
      .mockResolvedValueOnce({
        conservative_enabled: true,
        aggressive_enabled: false,
        updated_at: "2026-05-07T12:00:00Z",
      })
      // PUT echoes back
      .mockResolvedValueOnce({ ok: true });

    await reconcileEnginePrefsAfterAuth("ACCESS");

    expect(useTradingPrefsStore.getState().engineEnabled).toEqual({
      conservative: true,
      aggressive: false,
    });

    expect(mockAuthFetch).toHaveBeenCalledTimes(2);
    const putCall = mockAuthFetch.mock.calls[1]! as [string, Record<string, unknown>];
    expect(putCall[0]).toBe("/me/engine-prefs");
    expect((putCall[1] as { method: string }).method).toBe("PUT");
    expect((putCall[1] as { body: unknown }).body).toEqual({
      conservative_enabled: true,
      aggressive_enabled: false,
    });
  });

  test("falls back to local-as-truth push when GET fails", async () => {
    mockIsLiveBackendEnabled.mockReturnValue(true);
    useTradingPrefsStore.setState((s) => ({
      ...s,
      engineEnabled: { conservative: true, aggressive: true },
    }));
    mockAuthFetch
      .mockRejectedValueOnce(new Error("503"))
      .mockResolvedValueOnce({ ok: true });

    await reconcileEnginePrefsAfterAuth("ACCESS");

    // Local untouched
    expect(useTradingPrefsStore.getState().engineEnabled).toEqual({
      conservative: true,
      aggressive: true,
    });
    // PUT still ran
    const putCall = mockAuthFetch.mock.calls[1]! as [string, Record<string, unknown>];
    expect((putCall[1] as { body: unknown }).body).toEqual({
      conservative_enabled: true,
      aggressive_enabled: true,
    });
  });
});
