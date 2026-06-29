import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { MOCK_MT5_STATUS_ONLINE } from "@/mocks/mt5-status";
import {
  parseMt5StatusResponse,
  type Mt5StatusResponseDto,
} from "@/types/dto/mt5-status";
import { useAuthStore, selectAccessToken } from "@/state/authStore";
import { simulateFetch } from "./client";
import { authFetch, isLiveBackendEnabled } from "./liveBackend";

// JWT-scoped: returns the SIGNED-IN user's own account/balance, never the house
// account. (The old shared-key `/trading/mt5-status` returned the operator's
// account to every user — a multi-tenant data leak.)
const MT5_STATUS_PATH = "/me/mt5-status";

export const mt5StatusKeys = {
  all: ["mt5", "status"] as const,
};

function shouldUseLive(token: string | null): boolean {
  return isLiveBackendEnabled() && Boolean(token && token.length > 0);
}

async function fetchMt5StatusLive(accessToken: string): Promise<Mt5StatusResponseDto> {
  const raw = await authFetch<unknown>(MT5_STATUS_PATH, { bearerToken: accessToken });
  return parseMt5StatusResponse(raw);
}

export function useMt5Status(): UseQueryResult<Mt5StatusResponseDto, Error> {
  const accessToken = useAuthStore(selectAccessToken)?.value ?? null;
  const live = shouldUseLive(accessToken);
  return useQuery({
    queryKey: mt5StatusKeys.all,
    queryFn: () =>
      live
        ? fetchMt5StatusLive(accessToken as string)
        : simulateFetch<Mt5StatusResponseDto>(() => MOCK_MT5_STATUS_ONLINE),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
