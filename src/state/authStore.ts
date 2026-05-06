import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist, type PersistStorage } from "zustand/middleware";
import type { AccessToken, AuthSession, RefreshToken } from "@/types/auth";
import type { UserProfile } from "@/types/user";

const STORAGE_KEY = "tiwagold.auth.v1";

const ACCESS_REFRESH_THRESHOLD_MS = 60_000;

const secureStorage: PersistStorage<AuthPersistedState> = createJSONStorage(() => ({
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
})) as PersistStorage<AuthPersistedState>;

export interface AuthPersistedState {
  session: AuthSession | null;
  user: UserProfile | null;
  onboardingComplete: boolean;
}

export interface AuthStore extends AuthPersistedState {
  hydrated: boolean;
  signIn: (payload: { session: AuthSession; user: UserProfile }) => void;
  signOut: () => void;
  completeOnboarding: () => void;
  setUser: (user: UserProfile) => void;
  setSession: (session: AuthSession) => void;
  setAccessToken: (access: AccessToken) => void;
  setRefreshToken: (refresh: RefreshToken) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      onboardingComplete: false,
      hydrated: false,
      signIn: ({ session, user }) =>
        // Sticky-true onboarding completion. The cloud doesn't currently
        // track `onboardingCompletedAt`, so we honour the local flag and
        // only upgrade to `true` (never downgrade). Once a device has
        // completed the intro, signing in/out won't re-show it.
        set((state) => ({
          session,
          user,
          onboardingComplete:
            Boolean(user.onboardingCompletedAt) || state.onboardingComplete,
        })),
      signOut: () => set({ session: null, user: null }),
      completeOnboarding: () => set({ onboardingComplete: true }),
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setAccessToken: (access) =>
        set((state) =>
          state.session ? { session: { ...state.session, access } } : state,
        ),
      setRefreshToken: (refresh) =>
        set((state) =>
          state.session ? { session: { ...state.session, refresh } } : state,
        ),
    }),
    {
      name: STORAGE_KEY,
      storage: secureStorage,
      partialize: ({ session, user, onboardingComplete }) => ({
        session,
        user,
        onboardingComplete,
      }),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ hydrated: true });
      },
    },
  ),
);

export function selectIsAuthenticated(state: AuthStore): boolean {
  return Boolean(state.session && state.user);
}

export function selectRequiresOnboarding(state: AuthStore): boolean {
  return Boolean(state.session && state.user) && !state.onboardingComplete;
}

export function selectAccessToken(state: AuthStore): AccessToken | null {
  return state.session?.access ?? null;
}

export function selectRefreshToken(state: AuthStore): RefreshToken | null {
  return state.session?.refresh ?? null;
}

function parseExpiry(iso: string | undefined): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

export function isAccessExpired(state: AuthStore, nowMs: number = Date.now()): boolean {
  const expiresAt = parseExpiry(state.session?.access.expiresAt);
  if (expiresAt === null) return true;
  return nowMs >= expiresAt - ACCESS_REFRESH_THRESHOLD_MS;
}

export function isRefreshExpired(state: AuthStore, nowMs: number = Date.now()): boolean {
  const refresh = state.session?.refresh;
  if (!refresh) return true;
  const expiresAt = parseExpiry(refresh.expiresAt);
  if (expiresAt === null) return true;
  return nowMs >= expiresAt;
}

export function selectShouldRefresh(state: AuthStore, nowMs: number = Date.now()): boolean {
  if (!state.session) return false;
  return isAccessExpired(state, nowMs) && !isRefreshExpired(state, nowMs);
}
