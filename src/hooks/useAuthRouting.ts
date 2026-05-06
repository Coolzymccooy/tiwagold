import { useEffect } from "react";
import { router, useSegments } from "expo-router";
import {
  selectIsAuthenticated,
  selectRequiresOnboarding,
  useAuthStore,
} from "@/state/authStore";

/**
 * Top-level routing guard. Watches the auth store and redirects whenever
 * the user's auth state changes:
 *
 *   - signed out anywhere    → /(auth)/login
 *   - signed in + no onboard → /(auth)/onboarding
 *   - signed in + onboarded  → /(tabs)
 *
 * Without this, screens deep inside `(tabs)` (e.g. Settings) wouldn't
 * react to a `signOut()` action — the screen would render its empty/
 * error path forever because Expo Router only re-evaluates the index
 * route on initial mount.
 *
 * Mounted once from `app/_layout.tsx`; uses `useSegments()` so the
 * effect re-runs on every navigation and on every store change.
 */
export function useAuthRouting(): void {
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const requiresOnboarding = useAuthStore(selectRequiresOnboarding);
  const segments = useSegments();

  useEffect(() => {
    if (!hydrated) return;

    const segs = segments as readonly string[];
    const root = segs[0];
    const second = segs[1];
    const inAuthGroup = root === "(auth)";
    const onOnboarding = inAuthGroup && second === "onboarding";

    if (!isAuthenticated) {
      // Anywhere outside the auth group → kick back to login.
      if (!inAuthGroup) {
        router.replace("/(auth)/login");
      }
      return;
    }

    if (requiresOnboarding) {
      // Authenticated but hasn't seen onboarding yet — only the onboarding
      // screen itself is allowed. Login/signup/forgot-password would loop.
      if (!onOnboarding) {
        router.replace("/(auth)/onboarding");
      }
      return;
    }

    // Authenticated and onboarded — bail out of the auth group.
    if (inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [hydrated, isAuthenticated, requiresOnboarding, segments]);
}
