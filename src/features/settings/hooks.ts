import { useCallback, useMemo } from "react";
import { useCurrentUser, useSignOut } from "@/services/auth";
import { useMt5Status } from "@/services/mt5Status";
import { useAuthStore } from "@/state/authStore";
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
