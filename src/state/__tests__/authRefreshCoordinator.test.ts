import type { AccessToken, AuthSession, RefreshToken } from "@/types/auth";

import { coordinateRefresh, RefreshFailedError } from "../authRefreshCoordinator";
import { useAuthStore } from "../authStore";

const FIXED_NOW = new Date("2026-04-14T10:00:00Z");

function addMs(base: Date, ms: number): string {
  return new Date(base.getTime() + ms).toISOString();
}

function makeAccess(overrides: Partial<AccessToken> = {}): AccessToken {
  return {
    value: "access-value",
    tokenType: "Bearer",
    issuedAt: FIXED_NOW.toISOString(),
    expiresAt: addMs(FIXED_NOW, 15 * 60_000),
    ...overrides,
  };
}

function makeRefresh(overrides: Partial<RefreshToken> = {}): RefreshToken {
  return {
    value: "refresh-value",
    issuedAt: FIXED_NOW.toISOString(),
    expiresAt: addMs(FIXED_NOW, 60 * 60_000),
    ...overrides,
  };
}

function makeSession(overrides: Partial<AuthSession> = {}): AuthSession {
  return {
    userId: "user-1",
    access: makeAccess(),
    refresh: makeRefresh(),
    ...overrides,
  };
}

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(FIXED_NOW);
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  useAuthStore.setState({
    session: null,
    user: null,
    onboardingComplete: false,
    hydrated: false,
  });
});

describe("coordinateRefresh", () => {
  it("throws RefreshFailedError and signs out when no session is present", async () => {
    const refreshFn = jest.fn();

    await expect(coordinateRefresh(refreshFn)).rejects.toBeInstanceOf(
      RefreshFailedError,
    );
    expect(refreshFn).not.toHaveBeenCalled();
    expect(useAuthStore.getState().session).toBeNull();
  });

  it("throws RefreshFailedError and signs out when refresh token is expired", async () => {
    useAuthStore.getState().setSession(
      makeSession({ refresh: makeRefresh({ expiresAt: addMs(FIXED_NOW, -1_000) }) }),
    );
    const refreshFn = jest.fn();

    await expect(coordinateRefresh(refreshFn)).rejects.toBeInstanceOf(
      RefreshFailedError,
    );
    expect(refreshFn).not.toHaveBeenCalled();
    expect(useAuthStore.getState().session).toBeNull();
  });

  it("calls refreshFn with current refresh token value and stores returned session", async () => {
    const currentRefresh = makeRefresh({ value: "current-refresh" });
    useAuthStore.getState().setSession(makeSession({ refresh: currentRefresh }));

    const newSession = makeSession({
      userId: "user-1",
      access: makeAccess({ value: "new-access" }),
      refresh: makeRefresh({ value: "new-refresh" }),
    });
    const refreshFn = jest.fn().mockResolvedValue(newSession);

    const result = await coordinateRefresh(refreshFn);

    expect(refreshFn).toHaveBeenCalledWith("current-refresh");
    expect(result).toEqual(newSession);
    expect(useAuthStore.getState().session).toEqual(newSession);
  });

  it("dedupes concurrent callers — refreshFn is invoked exactly once", async () => {
    useAuthStore.getState().setSession(makeSession());

    let resolveFn: (s: AuthSession) => void = () => {};
    const pending = new Promise<AuthSession>((resolve) => {
      resolveFn = resolve;
    });
    const refreshFn = jest.fn().mockReturnValue(pending);

    const p1 = coordinateRefresh(refreshFn);
    const p2 = coordinateRefresh(refreshFn);
    const p3 = coordinateRefresh(refreshFn);

    const newSession = makeSession({ access: makeAccess({ value: "shared-new" }) });
    resolveFn(newSession);

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

    expect(refreshFn).toHaveBeenCalledTimes(1);
    expect(r1).toEqual(newSession);
    expect(r2).toEqual(newSession);
    expect(r3).toEqual(newSession);
  });

  it("signs out and wraps rejection in RefreshFailedError when refreshFn rejects", async () => {
    useAuthStore.getState().setSession(makeSession());

    const refreshFn = jest.fn().mockRejectedValue(new Error("network down"));

    await expect(coordinateRefresh(refreshFn)).rejects.toMatchObject({
      name: "RefreshFailedError",
      message: "network down",
    });
    expect(useAuthStore.getState().session).toBeNull();
  });

  it("falls back to 'Refresh failed' message when thrown value is not an Error", async () => {
    useAuthStore.getState().setSession(makeSession());

    const refreshFn = jest.fn().mockRejectedValue("something broke");

    await expect(coordinateRefresh(refreshFn)).rejects.toMatchObject({
      name: "RefreshFailedError",
      message: "Refresh failed",
    });
  });

  it("resets inflight after settlement so a subsequent call runs refreshFn again", async () => {
    useAuthStore.getState().setSession(makeSession());

    const first = makeSession({ access: makeAccess({ value: "v1" }) });
    const second = makeSession({ access: makeAccess({ value: "v2" }) });
    const refreshFn = jest
      .fn<Promise<AuthSession>, [string]>()
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second);

    await coordinateRefresh(refreshFn);
    await coordinateRefresh(refreshFn);

    expect(refreshFn).toHaveBeenCalledTimes(2);
    expect(useAuthStore.getState().session).toEqual(second);
  });

  it("resets inflight after a rejection so a subsequent call can retry", async () => {
    useAuthStore.getState().setSession(makeSession());

    const refreshFn = jest.fn().mockRejectedValue(new Error("boom"));
    await expect(coordinateRefresh(refreshFn)).rejects.toBeInstanceOf(
      RefreshFailedError,
    );

    useAuthStore.getState().setSession(makeSession());
    const recovered = makeSession({ access: makeAccess({ value: "recovered" }) });
    refreshFn.mockResolvedValueOnce(recovered);

    const result = await coordinateRefresh(refreshFn);
    expect(result).toEqual(recovered);
    expect(refreshFn).toHaveBeenCalledTimes(2);
  });
});
