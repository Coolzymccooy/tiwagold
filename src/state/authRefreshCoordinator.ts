import type { AuthSession } from "@/types/auth";
import { useAuthStore, isRefreshExpired, selectRefreshToken } from "./authStore";

export type RefreshFn = (refreshToken: string) => Promise<AuthSession>;

let inflight: Promise<AuthSession> | null = null;

export async function coordinateRefresh(refreshFn: RefreshFn): Promise<AuthSession> {
  if (inflight) return inflight;

  const state = useAuthStore.getState();
  const refresh = selectRefreshToken(state);
  if (!refresh || isRefreshExpired(state)) {
    state.signOut();
    throw new RefreshFailedError("Refresh token missing or expired");
  }

  inflight = (async () => {
    try {
      const session = await refreshFn(refresh.value);
      useAuthStore.getState().setSession(session);
      return session;
    } catch (error: unknown) {
      useAuthStore.getState().signOut();
      throw new RefreshFailedError(getErrorMessage(error));
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export class RefreshFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RefreshFailedError";
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Refresh failed";
}
