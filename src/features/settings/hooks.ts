import { useCallback, useMemo } from "react";
import { Alert } from "react-native";
import { useCurrentUser, useDeleteAccount, useSignOut } from "@/services/auth";
import { useMt5Status } from "@/services/mt5Status";
import { useAuthStore } from "@/state/authStore";
import { COPY } from "@/content/copy";
import { toSettingsView } from "./selectors";
import type { SettingsView } from "./types";

export interface UseSettingsResult {
  view: SettingsView | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useSettings(): UseSettingsResult {
  const session = useAuthStore((state) => state.session);
  const query = useCurrentUser(Boolean(session));
  const mt5 = useMt5Status();

  const view = useMemo(
    () => toSettingsView(query.data, mt5.data?.account ?? null),
    [query.data, mt5.data],
  );

  const refetch = useCallback(() => {
    void query.refetch();
  }, [query]);

  return {
    view,
    isLoading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    isError: query.isError,
    error: query.error ?? null,
    refetch,
  };
}

export interface UseSignOutActionResult {
  signOut: () => void;
  isSigningOut: boolean;
  error: Error | null;
}

export function useSignOutAction(): UseSignOutActionResult {
  const mutation = useSignOut();
  const clearAuth = useAuthStore((state) => state.signOut);

  const signOut = useCallback(() => {
    mutation.mutate(undefined, {
      onSuccess: () => {
        clearAuth();
      },
    });
  }, [mutation, clearAuth]);

  return {
    signOut,
    isSigningOut: mutation.isPending,
    error: mutation.error ?? null,
  };
}

export interface UseDeleteAccountActionResult {
  deleteAccount: () => void;
  isDeleting: boolean;
  error: Error | null;
}

/**
 * Wires `useDeleteAccount` to the auth store + a success/error alert.
 *
 * The double-confirm UX lives in `DangerZoneCard` (two `Alert.alert`
 * calls, the second `destructive`) — this hook only fires after both
 * confirmations and handles the post-call cleanup:
 *   1. Show success alert.
 *   2. Clear local auth state — `useAuthRouting` then redirects to
 *      `/(auth)/login`.
 *   3. On error, show an error alert (no auth wipe — user keeps trying).
 */
export function useDeleteAccountAction(): UseDeleteAccountActionResult {
  const mutation = useDeleteAccount();
  const clearAuth = useAuthStore((state) => state.signOut);

  const deleteAccount = useCallback(() => {
    mutation.mutate(undefined, {
      onSuccess: () => {
        Alert.alert(
          COPY.settings.danger.success.title,
          COPY.settings.danger.success.body,
          [{ text: COPY.common.done, onPress: () => clearAuth() }],
        );
      },
      onError: () => {
        Alert.alert(
          COPY.settings.danger.error.title,
          COPY.settings.danger.error.body,
          [{ text: COPY.common.close }],
        );
      },
    });
  }, [mutation, clearAuth]);

  return {
    deleteAccount,
    isDeleting: mutation.isPending,
    error: mutation.error ?? null,
  };
}
