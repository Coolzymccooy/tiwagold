import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { MOCK_TRADES, findMockTrade } from "@/mocks/trades";
import { journalToTrades } from "@/mappers/journal";
import type {
  ApproveTradeInput,
  ExecuteTradeInput,
} from "@/mappers/trades";
import { parseJournalDto } from "@/types/dto/journal";
import type {
  CandidateStatus,
  ExecutionStatus,
  Trade,
} from "@/types/trade";
import { useAuthStore, selectAccessToken } from "@/state/authStore";
import { nowIso, simulateFetch } from "./client";
import { isLiveBackendEnabled, authFetch } from "./liveBackend";
import { assertSignedIntentInProduction } from "./signedIntent";

// JWT-scoped: the signed-in user's OWN trades, never the house engine journal.
// (The old shared-key /trading/journal returned the operator's trades to every
// user — a multi-tenant data leak.)
const JOURNAL_PATH = "/me/journal";

function shouldUseLive(token: string | null): boolean {
  return isLiveBackendEnabled() && Boolean(token && token.length > 0);
}

async function fetchTradesLive(accessToken: string): Promise<Trade[]> {
  const raw = await authFetch<unknown>(JOURNAL_PATH, { bearerToken: accessToken });
  return journalToTrades(parseJournalDto(raw));
}

async function fetchTradeLive(id: string, accessToken: string): Promise<Trade> {
  const trades = await fetchTradesLive(accessToken);
  const trade = trades.find((t) => t.id === id);
  if (!trade) throw new Error("Trade not found");
  return trade;
}

export const tradeKeys = {
  all: ["trades"] as const,
  detail: (id: string) => ["trade", id] as const,
  autopsy: (id: string) => ["trade", id, "autopsy"] as const,
  execution: (id: string) => ["trade", id, "execution"] as const,
};

export function useTrades(): UseQueryResult<Trade[], Error> {
  const accessToken = useAuthStore(selectAccessToken)?.value ?? null;
  return useQuery({
    queryKey: tradeKeys.all,
    queryFn: () =>
      shouldUseLive(accessToken)
        ? fetchTradesLive(accessToken as string)
        : simulateFetch(() => MOCK_TRADES),
    staleTime: 10_000,
  });
}

export function useTrade(id: string | undefined): UseQueryResult<Trade, Error> {
  const accessToken = useAuthStore(selectAccessToken)?.value ?? null;
  return useQuery({
    queryKey: id ? tradeKeys.detail(id) : ["trade", "pending"],
    queryFn: () => {
      if (!id) throw new Error("Missing trade id");
      if (shouldUseLive(accessToken)) return fetchTradeLive(id, accessToken as string);
      return simulateFetch(() => {
        const trade = findMockTrade(id);
        if (!trade) throw new Error("Trade not found");
        return trade;
      });
    },
    enabled: Boolean(id),
    staleTime: 10_000,
  });
}

export interface UpdateTradeStatusInput {
  id: string;
  status: CandidateStatus;
  note?: string;
}

export function useUpdateTradeStatus(): UseMutationResult<
  Trade,
  Error,
  UpdateTradeStatusInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: UpdateTradeStatusInput) =>
      simulateFetch<Trade>(() => {
        const trade = findMockTrade(id);
        if (!trade) throw new Error("Trade not found");
        const timestamp = nowIso();
        return {
          ...trade,
          status,
          updatedAt: timestamp,
          timeline: [
            ...trade.timeline,
            {
              id: `evt_${timestamp}`,
              at: timestamp,
              kind: status === "cancelled" ? "cancelled" : "note",
              summary: note ?? `Status updated to ${status}`,
            },
          ],
        };
      }),
    onSuccess: (trade) => {
      queryClient.invalidateQueries({ queryKey: tradeKeys.all });
      queryClient.setQueryData(tradeKeys.detail(trade.id), trade);
    },
  });
}

export interface ApproveTradeVariables extends ApproveTradeInput {
  id: string;
}

export function useApproveTrade(): UseMutationResult<
  Trade,
  Error,
  ApproveTradeVariables
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note, intentToken }: ApproveTradeVariables) => {
      assertSignedIntentInProduction(intentToken);
      return simulateFetch<Trade>(() => {
        const trade = findMockTrade(id);
        if (!trade) throw new Error("Trade not found");
        const timestamp = nowIso();
        return {
          ...trade,
          status: "approved",
          updatedAt: timestamp,
          timeline: [
            ...trade.timeline,
            {
              id: `evt_approved_${timestamp}`,
              at: timestamp,
              kind: "approved",
              summary: note ?? "Approved by operator",
            },
          ],
        };
      });
    },
    onSuccess: (trade) => {
      queryClient.invalidateQueries({ queryKey: tradeKeys.all });
      queryClient.setQueryData(tradeKeys.detail(trade.id), trade);
    },
  });
}

export interface ExecuteTradeVariables extends ExecuteTradeInput {
  id: string;
}

export function useExecuteTrade(): UseMutationResult<
  Trade,
  Error,
  ExecuteTradeVariables
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, overrideLots, intentToken }: ExecuteTradeVariables) => {
      assertSignedIntentInProduction(intentToken);
      return simulateFetch<Trade>(() => {
        const trade = findMockTrade(id);
        if (!trade) throw new Error("Trade not found");
        const timestamp = nowIso();
        const filledPrice = trade.currentPrice ?? trade.proposedEntry;
        const detail =
          overrideLots !== undefined
            ? `Filled at ${filledPrice} (override ${overrideLots} lots)`
            : `Filled at ${filledPrice}`;
        return {
          ...trade,
          status: "executed",
          actualEntry: filledPrice,
          updatedAt: timestamp,
          timeline: [
            ...trade.timeline,
            {
              id: `evt_triggered_${timestamp}`,
              at: timestamp,
              kind: "triggered",
              summary: "Order routed to broker",
              detail,
            },
          ],
        };
      });
    },
    onSuccess: (trade) => {
      queryClient.invalidateQueries({ queryKey: tradeKeys.all });
      queryClient.setQueryData(tradeKeys.detail(trade.id), trade);
      queryClient.invalidateQueries({ queryKey: tradeKeys.execution(trade.id) });
    },
  });
}

export function useExecutionStatus(
  id: string | undefined,
): UseQueryResult<ExecutionStatus, Error> {
  return useQuery({
    queryKey: id ? tradeKeys.execution(id) : ["trade", "execution", "pending"],
    queryFn: () =>
      simulateFetch<ExecutionStatus>(() => {
        if (!id) throw new Error("Missing trade id");
        const trade = findMockTrade(id);
        if (!trade) throw new Error("Trade not found");
        return mockExecutionStatus(trade);
      }),
    enabled: Boolean(id),
    staleTime: 5_000,
  });
}

function mockExecutionStatus(trade: Trade): ExecutionStatus {
  const timestamp = nowIso();
  const baseStatus: Pick<
    ExecutionStatus,
    "tradeId" | "attempt" | "lastCheckedAt" | "brokerTicket"
  > = {
    tradeId: trade.id,
    attempt: 1,
    lastCheckedAt: timestamp,
    brokerTicket: trade.brokerTicket ?? null,
  };
  if (trade.status === "executed") {
    return {
      ...baseStatus,
      phase: "filled",
      filledPrice: trade.actualEntry ?? trade.proposedEntry,
      filledAt: trade.updatedAt,
      slippage: 0,
    };
  }
  if (trade.status === "cancelled" || trade.status === "expired") {
    return { ...baseStatus, phase: "cancelled" };
  }
  if (trade.status === "risk_blocked") {
    return {
      ...baseStatus,
      phase: "rejected",
      rejectionCode: "risk_blocked",
      rejectionMessage: "Risk gate rejected the order",
    };
  }
  if (trade.status === "approved") return { ...baseStatus, phase: "queued" };
  return { ...baseStatus, phase: "queued" };
}
