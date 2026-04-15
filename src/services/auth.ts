import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { MOCK_USER } from "@/mocks/user";
import type {
  AuthForgotPasswordInput,
  AuthRefreshInput,
  AuthResetPasswordInput,
  AuthSession,
} from "@/types/auth";
import type { UserProfile } from "@/types/user";
import { createId, nowIso, simulateFetch } from "./client";

export const authKeys = {
  me: ["user", "me"] as const,
  session: ["auth", "session"] as const,
};

export interface SignInInput {
  email: string;
  password: string;
}

const ACCESS_TTL_MS = 1000 * 60 * 15;
const REFRESH_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function buildSession(userId: string): AuthSession {
  const issuedAt = nowIso();
  const accessExpiresAt = new Date(Date.now() + ACCESS_TTL_MS).toISOString();
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TTL_MS).toISOString();
  return {
    userId,
    access: {
      value: createId("at"),
      tokenType: "Bearer",
      issuedAt,
      expiresAt: accessExpiresAt,
    },
    refresh: {
      value: createId("rt"),
      issuedAt,
      expiresAt: refreshExpiresAt,
    },
    scope: ["user.read", "trades.read", "trades.write"],
  };
}

export function useSignIn(): UseMutationResult<
  { session: AuthSession; user: UserProfile },
  Error,
  SignInInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email }: SignInInput) =>
      simulateFetch(() => ({
        session: buildSession(MOCK_USER.id),
        user: { ...MOCK_USER, email: email || MOCK_USER.email },
      })),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(authKeys.me, user);
    },
  });
}

export function useAuthSession(
  enabled: boolean,
): UseQueryResult<AuthSession | null, Error> {
  return useQuery({
    queryKey: authKeys.session,
    queryFn: () => simulateFetch(() => buildSession(MOCK_USER.id)),
    enabled,
    staleTime: 60_000,
  });
}

export function useRefreshSession(): UseMutationResult<
  AuthSession,
  Error,
  AuthRefreshInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => simulateFetch(() => buildSession(MOCK_USER.id)),
    onSuccess: (session) => {
      queryClient.setQueryData(authKeys.session, session);
    },
  });
}

export function useCurrentUser(enabled: boolean): UseQueryResult<UserProfile, Error> {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: () => simulateFetch(() => MOCK_USER),
    enabled,
    staleTime: 60_000,
  });
}

export function useSignOut(): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => simulateFetch(() => undefined),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: authKeys.me });
      queryClient.removeQueries({ queryKey: authKeys.session });
    },
  });
}

export function useForgotPassword(): UseMutationResult<
  { accepted: true; requestId: string },
  Error,
  AuthForgotPasswordInput
> {
  return useMutation({
    mutationFn: () =>
      simulateFetch(() => ({ accepted: true as const, requestId: createId("pwreq") })),
  });
}

export function useResetPassword(): UseMutationResult<
  { accepted: true },
  Error,
  AuthResetPasswordInput
> {
  return useMutation({
    mutationFn: () => simulateFetch(() => ({ accepted: true as const })),
  });
}
