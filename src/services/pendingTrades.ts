/**
 * Pending trades service — Sprint C.3.
 *
 *   useApprovedQueue() ── reads /trades/pending (live) or mock fixture
 *   useApproveTrade(id)  ── mints signed-intent JWT + POSTs /trades/:id/approve
 *   useDenyTrade(id)     ── same flow with deny intent
 *
 * Mock fallback returns an empty list — there's no useful mock fixture for
 * pending awaiting_approval rows since a fresh app install with a mock
 * backend wouldn't have any. Live mode is the real target.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { authFetch, isLiveBackendEnabled } from "./liveBackend";
import { simulateFetch } from "./client";
import {
  parsePendingTradesResponse,
  approveTradeResponseSchema,
  type ApproveTradeResponse,
  type PendingTrade,
} from "@/types/dto/pendingTrades";
import {
  signApprovalIntent,
  signDenyIntent,
} from "./liveSignedIntent";
import { useAuthStore } from "@/state/authStore";

export const pendingTradeKeys = {
  all: ["pending-trades"] as const,
};

async function fetchPendingTradesLive(bearerToken: string): Promise<PendingTrade[]> {
  const raw = await authFetch<unknown>("/trades/pending", { bearerToken });
  return parsePendingTradesResponse(raw);
}

export function usePendingTrades(): UseQueryResult<PendingTrade[], Error> {
  const access = useAuthStore((s) => s.session?.access?.value ?? null);
  return useQuery({
    queryKey: pendingTradeKeys.all,
    queryFn: () => {
      if (!isLiveBackendEnabled()) {
        return simulateFetch<PendingTrade[]>(() => []);
      }
      if (!access) throw new Error("Not signed in");
      return fetchPendingTradesLive(access);
    },
    refetchInterval: 15_000,
    staleTime: 5_000,
  });
}

interface ApproveDenyArgs {
  tradeId: string;
}

async function performApproveTrade(args: {
  tradeId: string;
  bearerToken: string;
}): Promise<ApproveTradeResponse> {
  const intentJwt = await signApprovalIntent({
    bearerToken: args.bearerToken,
    tradeId: args.tradeId,
  });
  const raw = await authFetch<unknown>(
    `/trades/${encodeURIComponent(args.tradeId)}/approve`,
    {
      method: "POST",
      bearerToken: args.bearerToken,
      extraHeaders: { "x-intent": intentJwt },
    },
  );
  return approveTradeResponseSchema.parse(raw) as ApproveTradeResponse;
}

async function performDenyTrade(args: {
  tradeId: string;
  bearerToken: string;
}): Promise<ApproveTradeResponse> {
  const intentJwt = await signDenyIntent({
    bearerToken: args.bearerToken,
    tradeId: args.tradeId,
  });
  const raw = await authFetch<unknown>(
    `/trades/${encodeURIComponent(args.tradeId)}/deny`,
    {
      method: "POST",
      bearerToken: args.bearerToken,
      extraHeaders: { "x-intent": intentJwt },
    },
  );
  return approveTradeResponseSchema.parse(raw) as ApproveTradeResponse;
}

export function useApproveTrade(): UseMutationResult<
  ApproveTradeResponse,
  Error,
  ApproveDenyArgs
> {
  const queryClient = useQueryClient();
  const access = useAuthStore((s) => s.session?.access?.value ?? null);
  return useMutation({
    mutationFn: async ({ tradeId }: ApproveDenyArgs) => {
      if (!isLiveBackendEnabled()) {
        // Mock path: no-op, return optimistic success
        return simulateFetch<ApproveTradeResponse>(() => ({
          id: tradeId,
          approvalStatus: "approved",
        }));
      }
      if (!access) throw new Error("Not signed in");
      return performApproveTrade({ tradeId, bearerToken: access });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pendingTradeKeys.all });
    },
  });
}

export function useDenyTrade(): UseMutationResult<
  ApproveTradeResponse,
  Error,
  ApproveDenyArgs
> {
  const queryClient = useQueryClient();
  const access = useAuthStore((s) => s.session?.access?.value ?? null);
  return useMutation({
    mutationFn: async ({ tradeId }: ApproveDenyArgs) => {
      if (!isLiveBackendEnabled()) {
        return simulateFetch<ApproveTradeResponse>(() => ({
          id: tradeId,
          approvalStatus: "denied",
        }));
      }
      if (!access) throw new Error("Not signed in");
      return performDenyTrade({ tradeId, bearerToken: access });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pendingTradeKeys.all });
    },
  });
}
