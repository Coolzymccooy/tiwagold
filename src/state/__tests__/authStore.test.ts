import type { AccessToken, AuthSession, RefreshToken } from "@/types/auth";
import type { UserProfile } from "@/types/user";

import {
  isAccessExpired,
  isRefreshExpired,
  selectAccessToken,
  selectIsAuthenticated,
  selectRefreshToken,
  selectRequiresOnboarding,
  selectShouldRefresh,
  useAuthStore,
} from "../authStore";

const FIXED_NOW = new Date("2026-04-14T10:00:00Z");

function addMs(base: Date, ms: number): string {
  return new Date(base.getTime() + ms).toISOString();
}

function makeAccessToken(overrides: Partial<AccessToken> = {}): AccessToken {
  return {
    value: "access-value",
    tokenType: "Bearer",
    issuedAt: FIXED_NOW.toISOString(),
    expiresAt: addMs(FIXED_NOW, 15 * 60_000),
    ...overrides,
  };
}

function makeRefreshToken(overrides: Partial<RefreshToken> = {}): RefreshToken {
  return {
    value: "refresh-value",
    issuedAt: FIXED_NOW.toISOString(),
    expiresAt: addMs(FIXED_NOW, 7 * 24 * 60 * 60_000),
    ...overrides,
  };
}

function makeSession(overrides: Partial<AuthSession> = {}): AuthSession {
  return {
    userId: "user-1",
    access: makeAccessToken(),
    refresh: makeRefreshToken(),
    ...overrides,
  };
}

function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "user-1",
    email: "test@tiwa.gold",
    displayName: "Test User",
    tier: "pro",
    createdAt: FIXED_NOW.toISOString(),
    onboardingCompletedAt: FIXED_NOW.toISOString(),
    notifications: {
      signalAlerts: true,
      riskBlocks: true,
      dailyRecap: true,
      macroRadar: false,
    },
    riskProfile: "balanced",
    ...overrides,
  };
}

function storeState() {
  return useAuthStore.getState();
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
  (jest.requireMock("expo-secure-store") as { __reset: () => void }).__reset();
});

describe("useAuthStore — initial state", () => {
  it("starts with null session, null user, onboardingComplete=false, hydrated=false", () => {
    const s = storeState();
    expect(s.session).toBeNull();
    expect(s.user).toBeNull();
    expect(s.onboardingComplete).toBe(false);
    expect(s.hydrated).toBe(false);
  });
});

describe("signIn", () => {
  it("sets session, user, and onboardingComplete=true when user has onboardingCompletedAt", () => {
    const session = makeSession();
    const user = makeUser({ onboardingCompletedAt: FIXED_NOW.toISOString() });
    storeState().signIn({ session, user });

    const s = storeState();
    expect(s.session).toEqual(session);
    expect(s.user).toEqual(user);
    expect(s.onboardingComplete).toBe(true);
  });

  it("sets onboardingComplete=false when user has no onboardingCompletedAt", () => {
    const session = makeSession();
    const user = makeUser({ onboardingCompletedAt: undefined });
    storeState().signIn({ session, user });

    expect(storeState().onboardingComplete).toBe(false);
  });
});

describe("signOut", () => {
  it("clears session and user", () => {
    storeState().signIn({ session: makeSession(), user: makeUser() });
    storeState().signOut();

    const s = storeState();
    expect(s.session).toBeNull();
    expect(s.user).toBeNull();
  });

  it("preserves onboardingComplete across sign-out (device-sticky)", () => {
    storeState().signIn({ session: makeSession(), user: makeUser() });
    expect(storeState().onboardingComplete).toBe(true);

    storeState().signOut();

    // Once onboarded on this device, signing out shouldn't make us
    // re-watch the intro slides on next sign-in.
    expect(storeState().onboardingComplete).toBe(true);
  });
});

describe("signIn — sticky onboarding completion", () => {
  it("upgrades onboardingComplete=false → true when the cloud user has onboardingCompletedAt", () => {
    storeState().signIn({
      session: makeSession(),
      user: makeUser({ onboardingCompletedAt: FIXED_NOW.toISOString() }),
    });
    expect(storeState().onboardingComplete).toBe(true);
  });

  it("preserves an existing onboardingComplete=true when the cloud doesn't return onboardingCompletedAt", () => {
    storeState().completeOnboarding();
    expect(storeState().onboardingComplete).toBe(true);

    // Simulate the live cloud, which currently returns no onboardingCompletedAt.
    storeState().signIn({
      session: makeSession(),
      user: makeUser({ onboardingCompletedAt: undefined }),
    });

    // Must remain true — otherwise every sign-in re-shows the intro slides.
    expect(storeState().onboardingComplete).toBe(true);
  });

  it("does not falsely set onboardingComplete=true when both local and cloud are unset", () => {
    storeState().signIn({
      session: makeSession(),
      user: makeUser({ onboardingCompletedAt: undefined }),
    });
    expect(storeState().onboardingComplete).toBe(false);
  });
});

describe("completeOnboarding", () => {
  it("sets onboardingComplete=true", () => {
    storeState().completeOnboarding();
    expect(storeState().onboardingComplete).toBe(true);
  });
});

describe("setUser", () => {
  it("replaces the user", () => {
    const first = makeUser({ id: "u1", displayName: "First" });
    const second = makeUser({ id: "u2", displayName: "Second" });
    storeState().setUser(first);
    expect(storeState().user).toEqual(first);
    storeState().setUser(second);
    expect(storeState().user).toEqual(second);
  });
});

describe("setSession", () => {
  it("replaces the session", () => {
    const first = makeSession({ userId: "u1" });
    const second = makeSession({ userId: "u2" });
    storeState().setSession(first);
    expect(storeState().session).toEqual(first);
    storeState().setSession(second);
    expect(storeState().session).toEqual(second);
  });
});

describe("setAccessToken", () => {
  it("updates session.access when session exists", () => {
    storeState().signIn({ session: makeSession(), user: makeUser() });
    const next = makeAccessToken({ value: "new-access" });
    storeState().setAccessToken(next);

    expect(storeState().session?.access).toEqual(next);
  });

  it("is a no-op when session is null", () => {
    const before = storeState();
    storeState().setAccessToken(makeAccessToken({ value: "ignored" }));
    const after = storeState();

    expect(after.session).toBeNull();
    expect(after.user).toBe(before.user);
    expect(after.onboardingComplete).toBe(before.onboardingComplete);
  });
});

describe("setRefreshToken", () => {
  it("updates session.refresh when session exists", () => {
    storeState().signIn({ session: makeSession(), user: makeUser() });
    const next = makeRefreshToken({ value: "new-refresh" });
    storeState().setRefreshToken(next);

    expect(storeState().session?.refresh).toEqual(next);
  });

  it("is a no-op when session is null", () => {
    storeState().setRefreshToken(makeRefreshToken({ value: "ignored" }));
    expect(storeState().session).toBeNull();
  });
});

describe("selectIsAuthenticated", () => {
  it("is false when session and user are null", () => {
    expect(selectIsAuthenticated(storeState())).toBe(false);
  });

  it("is false when session exists but user is null", () => {
    storeState().setSession(makeSession());
    expect(selectIsAuthenticated(storeState())).toBe(false);
  });

  it("is false when user exists but session is null", () => {
    storeState().setUser(makeUser());
    expect(selectIsAuthenticated(storeState())).toBe(false);
  });

  it("is true when both session and user are present", () => {
    storeState().signIn({ session: makeSession(), user: makeUser() });
    expect(selectIsAuthenticated(storeState())).toBe(true);
  });
});

describe("selectRequiresOnboarding", () => {
  it("is false when unauthenticated", () => {
    expect(selectRequiresOnboarding(storeState())).toBe(false);
  });

  it("is true when authenticated and onboardingComplete is false", () => {
    storeState().signIn({
      session: makeSession(),
      user: makeUser({ onboardingCompletedAt: undefined }),
    });
    expect(selectRequiresOnboarding(storeState())).toBe(true);
  });

  it("is false when authenticated and onboardingComplete is true", () => {
    storeState().signIn({
      session: makeSession(),
      user: makeUser({ onboardingCompletedAt: FIXED_NOW.toISOString() }),
    });
    expect(selectRequiresOnboarding(storeState())).toBe(false);
  });
});

describe("selectAccessToken / selectRefreshToken", () => {
  it("return null when session is null", () => {
    expect(selectAccessToken(storeState())).toBeNull();
    expect(selectRefreshToken(storeState())).toBeNull();
  });

  it("return session tokens when session exists", () => {
    const access = makeAccessToken({ value: "a" });
    const refresh = makeRefreshToken({ value: "r" });
    storeState().setSession(makeSession({ access, refresh }));

    expect(selectAccessToken(storeState())).toEqual(access);
    expect(selectRefreshToken(storeState())).toEqual(refresh);
  });
});

describe("isAccessExpired", () => {
  it("returns true when no session is present", () => {
    expect(isAccessExpired(storeState())).toBe(true);
  });

  it("returns true when expiresAt is in the past", () => {
    storeState().setSession(
      makeSession({ access: makeAccessToken({ expiresAt: addMs(FIXED_NOW, -1_000) }) }),
    );
    expect(isAccessExpired(storeState())).toBe(true);
  });

  it("returns true when expiresAt is within the 60s refresh threshold", () => {
    storeState().setSession(
      makeSession({ access: makeAccessToken({ expiresAt: addMs(FIXED_NOW, 30_000) }) }),
    );
    expect(isAccessExpired(storeState())).toBe(true);
  });

  it("returns false when expiresAt is safely beyond the threshold", () => {
    storeState().setSession(
      makeSession({ access: makeAccessToken({ expiresAt: addMs(FIXED_NOW, 5 * 60_000) }) }),
    );
    expect(isAccessExpired(storeState())).toBe(false);
  });

  it("returns true when expiresAt is an invalid date string", () => {
    storeState().setSession(
      makeSession({ access: makeAccessToken({ expiresAt: "not-a-date" }) }),
    );
    expect(isAccessExpired(storeState())).toBe(true);
  });
});

describe("isRefreshExpired", () => {
  it("returns true when no session is present", () => {
    expect(isRefreshExpired(storeState())).toBe(true);
  });

  it("returns true when expiresAt is in the past", () => {
    storeState().setSession(
      makeSession({
        refresh: makeRefreshToken({ expiresAt: addMs(FIXED_NOW, -1_000) }),
      }),
    );
    expect(isRefreshExpired(storeState())).toBe(true);
  });

  it("does not apply a threshold — near-future expiresAt is still not expired", () => {
    storeState().setSession(
      makeSession({
        refresh: makeRefreshToken({ expiresAt: addMs(FIXED_NOW, 30_000) }),
      }),
    );
    expect(isRefreshExpired(storeState())).toBe(false);
  });

  it("returns false when expiresAt is far in the future", () => {
    storeState().setSession(
      makeSession({
        refresh: makeRefreshToken({
          expiresAt: addMs(FIXED_NOW, 7 * 24 * 60 * 60_000),
        }),
      }),
    );
    expect(isRefreshExpired(storeState())).toBe(false);
  });

  it("returns true when expiresAt is an invalid date string", () => {
    storeState().setSession(
      makeSession({ refresh: makeRefreshToken({ expiresAt: "not-a-date" }) }),
    );
    expect(isRefreshExpired(storeState())).toBe(true);
  });
});

describe("selectShouldRefresh", () => {
  it("returns false when session is null", () => {
    expect(selectShouldRefresh(storeState())).toBe(false);
  });

  it("returns true when access expired and refresh still valid", () => {
    storeState().setSession(
      makeSession({
        access: makeAccessToken({ expiresAt: addMs(FIXED_NOW, -1_000) }),
        refresh: makeRefreshToken({ expiresAt: addMs(FIXED_NOW, 60 * 60_000) }),
      }),
    );
    expect(selectShouldRefresh(storeState())).toBe(true);
  });

  it("returns false when access expired but refresh also expired", () => {
    storeState().setSession(
      makeSession({
        access: makeAccessToken({ expiresAt: addMs(FIXED_NOW, -10_000) }),
        refresh: makeRefreshToken({ expiresAt: addMs(FIXED_NOW, -5_000) }),
      }),
    );
    expect(selectShouldRefresh(storeState())).toBe(false);
  });

  it("returns false when access is still valid", () => {
    storeState().setSession(
      makeSession({
        access: makeAccessToken({ expiresAt: addMs(FIXED_NOW, 5 * 60_000) }),
        refresh: makeRefreshToken({ expiresAt: addMs(FIXED_NOW, 60 * 60_000) }),
      }),
    );
    expect(selectShouldRefresh(storeState())).toBe(false);
  });
});
