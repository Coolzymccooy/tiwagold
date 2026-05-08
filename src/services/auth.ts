import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { z } from "zod";
import { MOCK_USER } from "@/mocks/user";
import { useAuthStore, selectAccessToken } from "@/state/authStore";
import type {
  AuthForgotPasswordInput,
  AuthRefreshInput,
  AuthResetPasswordInput,
  AuthSession,
} from "@/types/auth";
import type { UserProfile } from "@/types/user";
import { createId, nowIso, simulateFetch } from "./client";
import { authFetch, isLiveBackendEnabled } from "./liveBackend";
import {
  registerExpoPushTokenWithCloud,
  clearExpoPushTokenFromCloud,
} from "./expoPushToken";
import { reconcileEnginePrefsAfterAuth } from "./engineSync";

export const authKeys = {
  me: ["user", "me"] as const,
  session: ["auth", "session"] as const,
};

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput {
  email: string;
  password: string;
  displayName: string;
}

const ACCESS_TTL_MS = 1000 * 60 * 15;
const REFRESH_TTL_MS = 1000 * 60 * 60 * 24 * 30;

const liveTierSchema = z.enum(["trial", "pro", "founder"]);

const liveAuthResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    displayName: z.string(),
    tier: liveTierSchema,
    createdAt: z.string(),
  }),
  accessToken: z.string(),
  accessTokenExpiresAt: z.string(),
  refreshToken: z.string().optional(),
  refreshTokenExpiresAt: z.string().optional(),
});

const liveCurrentUserSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    displayName: z.string(),
    tier: liveTierSchema,
    createdAt: z.string(),
  }),
});

type LiveAuthResponse = z.infer<typeof liveAuthResponseSchema>;

function liveResponseToProfile(response: LiveAuthResponse): UserProfile {
  return {
    id: response.user.id,
    email: response.user.email,
    displayName: response.user.displayName,
    tier: response.user.tier,
    createdAt: response.user.createdAt,
    notifications: {
      signalAlerts: true,
      riskBlocks: true,
      dailyRecap: true,
      macroRadar: false,
    },
    riskProfile: "balanced",
  };
}

function liveResponseToSession(response: LiveAuthResponse): AuthSession {
  const issuedAt = nowIso();
  const session: AuthSession = {
    userId: response.user.id,
    access: {
      value: response.accessToken,
      tokenType: "Bearer",
      issuedAt,
      expiresAt: response.accessTokenExpiresAt,
    },
  };
  if (response.refreshToken && response.refreshTokenExpiresAt) {
    session.refresh = {
      value: response.refreshToken,
      issuedAt,
      expiresAt: response.refreshTokenExpiresAt,
    };
  }
  return session;
}

function buildMockSession(userId: string): AuthSession {
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
    mutationFn: async ({ email, password }: SignInInput) => {
      if (isLiveBackendEnabled()) {
        const raw = await authFetch<unknown>("/auth/sign-in", {
          method: "POST",
          body: { email, password },
        });
        const response = liveAuthResponseSchema.parse(raw);
        return {
          session: liveResponseToSession(response),
          user: liveResponseToProfile(response),
        };
      }
      return simulateFetch(() => ({
        session: buildMockSession(MOCK_USER.id),
        user: { ...MOCK_USER, email: email || MOCK_USER.email },
      }));
    },
    onSuccess: ({ user, session }) => {
      queryClient.setQueryData(authKeys.me, user);
      void registerPushTokenAfterAuth(session.access.value);
    },
  });
}

export function useSignUp(): UseMutationResult<
  { session: AuthSession; user: UserProfile },
  Error,
  SignUpInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, password, displayName }: SignUpInput) => {
      if (isLiveBackendEnabled()) {
        const raw = await authFetch<unknown>("/auth/sign-up", {
          method: "POST",
          body: { email, password, displayName },
        });
        const response = liveAuthResponseSchema.parse(raw);
        return {
          session: liveResponseToSession(response),
          user: liveResponseToProfile(response),
        };
      }
      return simulateFetch(() => ({
        session: buildMockSession(MOCK_USER.id),
        user: { ...MOCK_USER, email: email || MOCK_USER.email, displayName },
      }));
    },
    onSuccess: ({ user, session }) => {
      queryClient.setQueryData(authKeys.me, user);
      void registerPushTokenAfterAuth(session.access.value);
    },
  });
}

/**
 * Fire-and-forget push-token registration. Lives outside the mutation
 * onSuccess callback so failures (permission denied, no project id, network)
 * never cascade into auth failure. Skipped entirely in mock builds — there's
 * no live `/me/*` endpoint to PUT to.
 */
function registerPushTokenAfterAuth(accessToken: string): void {
  if (!isLiveBackendEnabled()) return;
  registerExpoPushTokenWithCloud({ bearerToken: accessToken })
    .catch(() => {
      // The service swallows errors and returns `{ ok: false }`, but defend
      // against rejected promises just in case a future change breaks that.
    });
  // Phase N2 + Q — first hydrate engine prefs from the cloud (so a fresh
  // install on a new device picks up the user's last toggle instead of
  // overwriting it with the default both-on), then push the resulting state
  // back so the row reflects the device's view. gold-monitor's fan-out
  // reads that row to decide whether to enqueue a signal for this user.
  reconcileEnginePrefsAfterAuth(accessToken).catch(() => {
    // reconcile already swallows internal failures; defend against any
    // future change that throws.
  });
}

export function useAuthSession(
  enabled: boolean,
): UseQueryResult<AuthSession | null, Error> {
  return useQuery({
    queryKey: authKeys.session,
    queryFn: () => simulateFetch(() => buildMockSession(MOCK_USER.id)),
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
    mutationFn: async ({ refreshToken }: AuthRefreshInput) => {
      if (isLiveBackendEnabled()) {
        const raw = await authFetch<unknown>("/auth/refresh", {
          method: "POST",
          body: { refreshToken },
        });
        const response = liveAuthResponseSchema.parse(raw);
        return liveResponseToSession(response);
      }
      return simulateFetch(() => buildMockSession(MOCK_USER.id));
    },
    onSuccess: (session) => {
      queryClient.setQueryData(authKeys.session, session);
    },
  });
}

export function useCurrentUser(enabled: boolean): UseQueryResult<UserProfile, Error> {
  const accessToken = useAuthStore(selectAccessToken)?.value ?? null;
  return useQuery({
    queryKey: authKeys.me,
    queryFn: async () => {
      if (isLiveBackendEnabled() && accessToken) {
        const raw = await authFetch<unknown>("/users/me", {
          method: "GET",
          bearerToken: accessToken,
        });
        const parsed = liveCurrentUserSchema.parse(raw);
        return liveResponseToProfile({
          user: parsed.user,
          accessToken: "",
          accessTokenExpiresAt: "",
        });
      }
      return simulateFetch(() => MOCK_USER);
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useSignOut(): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const accessToken = useAuthStore.getState().session?.access?.value;
      const refreshToken = useAuthStore.getState().session?.refresh?.value;
      if (isLiveBackendEnabled() && refreshToken) {
        // Clear the device's push token from the cloud BEFORE revoking the
        // session — once the access token is dead, we can't authenticate the
        // PUT. Best-effort: failures don't block sign-out.
        if (accessToken) {
          try {
            await clearExpoPushTokenFromCloud({ bearerToken: accessToken });
          } catch {
            // ignore — clearExpoPushTokenFromCloud already swallows network
            // errors; this catch is paranoia.
          }
        }
        // Best-effort revoke. Mobile state is cleared either way.
        try {
          await authFetch<unknown>("/auth/sign-out", {
            method: "POST",
            body: { refreshToken },
          });
        } catch {
          // Network or 4xx — proceed with local sign-out.
        }
        return;
      }
      return simulateFetch(() => undefined);
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: authKeys.me });
      queryClient.removeQueries({ queryKey: authKeys.session });
    },
  });
}

const liveDeleteAccountResponseSchema = z.object({
  ok: z.literal(true),
  deletedAt: z.string(),
  cleanup: z.object({
    refreshTokens: z.number(),
    passwordResets: z.number(),
    brokerConnections: z.number(),
  }),
});

export interface DeleteAccountResult {
  ok: true;
  deletedAt: string;
  cleanup: {
    refreshTokens: number;
    passwordResets: number;
    brokerConnections: number;
  };
}

export function useDeleteAccount(): UseMutationResult<
  DeleteAccountResult,
  Error,
  void
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const accessToken = useAuthStore.getState().session?.access.value ?? null;
      if (isLiveBackendEnabled()) {
        if (!accessToken) {
          throw new Error("No active session");
        }
        const raw = await authFetch<unknown>("/users/me", {
          method: "DELETE",
          bearerToken: accessToken,
        });
        const parsed = liveDeleteAccountResponseSchema.parse(raw);
        return {
          ok: parsed.ok,
          deletedAt: parsed.deletedAt,
          cleanup: parsed.cleanup,
        };
      }
      return simulateFetch(() => ({
        ok: true as const,
        deletedAt: nowIso(),
        cleanup: { refreshTokens: 0, passwordResets: 0, brokerConnections: 0 },
      }));
    },
    onSuccess: () => {
      // Wipe every cached query for this user — the account is gone.
      queryClient.clear();
    },
  });
}

const liveForgotPasswordResponseSchema = z.object({
  accepted: z.literal(true),
  requestId: z.string(),
});

const liveResetPasswordResponseSchema = z.object({
  ok: z.literal(true),
});

export function useForgotPassword(): UseMutationResult<
  { accepted: true; requestId: string },
  Error,
  AuthForgotPasswordInput
> {
  return useMutation({
    mutationFn: async (input) => {
      if (isLiveBackendEnabled()) {
        const raw = await authFetch<unknown>("/auth/forgot-password", {
          method: "POST",
          body: { email: input.email },
        });
        const parsed = liveForgotPasswordResponseSchema.parse(raw);
        return { accepted: parsed.accepted, requestId: parsed.requestId };
      }
      return simulateFetch(() => ({ accepted: true as const, requestId: createId("pwreq") }));
    },
  });
}

export function useResetPassword(): UseMutationResult<
  { accepted: true },
  Error,
  AuthResetPasswordInput
> {
  return useMutation({
    mutationFn: async (input) => {
      if (isLiveBackendEnabled()) {
        const raw = await authFetch<unknown>("/auth/reset-password", {
          method: "POST",
          body: { token: input.token, newPassword: input.newPassword },
        });
        liveResetPasswordResponseSchema.parse(raw);
        return { accepted: true as const };
      }
      return simulateFetch(() => ({ accepted: true as const }));
    },
  });
}
