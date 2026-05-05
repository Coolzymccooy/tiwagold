import { useCallback, useMemo, useState } from "react";
import { useBrokerConnections } from "@/services/broker";
import {
  useApproveTrade,
  useTrades,
  useUpdateTradeStatus,
} from "@/services/trades";
import {
  useRequestSignedIntent,
  type SignedIntentError,
} from "@/services/signedIntent";
import { useTradingPrefsStore } from "@/state/tradingPrefsStore";
import {
  selectLivePortfolioPnlUsd,
  selectTradeFeed,
  selectTradeFeedCounts,
} from "./selectors";
import type {
  TradeFeedCounts,
  TradeFeedFilter,
  TradeFeedItem,
} from "./types";

export interface UseTradeFeedResult {
  items: TradeFeedItem[];
  counts: TradeFeedCounts;
  filter: TradeFeedFilter;
  setFilter: (filter: TradeFeedFilter) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  isError: boolean;
  refetch: () => void;
  portfolio: {
    equity: number | null;
    balance: number | null;
    currency: string;
    dailyPnlUsd: number;
  };
  approve: (tradeId: string) => void;
  reject: (tradeId: string) => void;
  approvingTradeId: string | null;
  rejectingTradeId: string | null;
  actionError: string | null;
}

export function useTradeFeed(): UseTradeFeedResult {
  const [filter, setFilterState] = useState<TradeFeedFilter>("all");
  const [approvingTradeId, setApprovingTradeId] = useState<string | null>(null);
  const [rejectingTradeId, setRejectingTradeId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const query = useTrades();
  const brokers = useBrokerConnections();
  const approveMutation = useApproveTrade();
  const cancelMutation = useUpdateTradeStatus();
  const intentMutation = useRequestSignedIntent();
  const engineEnabled = useTradingPrefsStore((state) => state.engineEnabled);

  const items = useMemo(
    () => selectTradeFeed(query.data, filter, engineEnabled),
    [query.data, filter, engineEnabled],
  );

  const counts = useMemo(
    () => selectTradeFeedCounts(query.data),
    [query.data],
  );

  const portfolio = useMemo(() => {
    const primary = brokers.data?.[0];
    return {
      equity: primary?.equity ?? primary?.balance ?? null,
      balance: primary?.balance ?? null,
      currency: primary?.currency ?? "USD",
      dailyPnlUsd: selectLivePortfolioPnlUsd(query.data),
    };
  }, [brokers.data, query.data]);

  const setFilter = useCallback((next: TradeFeedFilter) => {
    setFilterState(next);
  }, []);

  const refetch = useCallback(() => {
    query.refetch();
  }, [query]);

  const approve = useCallback(
    (tradeId: string) => {
      if (approvingTradeId || rejectingTradeId) return;
      setActionError(null);
      setApprovingTradeId(tradeId);
      void (async () => {
        try {
          const intent = await intentMutation.mutateAsync({
            purpose: "trade.approve",
            subjectId: tradeId,
          });
          await approveMutation.mutateAsync({
            id: tradeId,
            intentToken: intent.token,
            note: "Approved from feed",
          });
        } catch (error: unknown) {
          setActionError(toActionMessage(error));
        } finally {
          setApprovingTradeId(null);
        }
      })();
    },
    [approveMutation, approvingTradeId, intentMutation, rejectingTradeId],
  );

  const reject = useCallback(
    (tradeId: string) => {
      if (approvingTradeId || rejectingTradeId) return;
      setActionError(null);
      setRejectingTradeId(tradeId);
      cancelMutation.mutate(
        { id: tradeId, status: "cancelled", note: "Rejected from feed" },
        {
          onError: (error: Error) => setActionError(toActionMessage(error)),
          onSettled: () => setRejectingTradeId(null),
        },
      );
    },
    [approvingTradeId, cancelMutation, rejectingTradeId],
  );

  return {
    items,
    counts,
    filter,
    setFilter,
    isLoading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    isError: query.isError,
    refetch,
    portfolio,
    approve,
    reject,
    approvingTradeId,
    rejectingTradeId,
    actionError,
  };
}

function toActionMessage(error: unknown): string {
  if (isSignedIntentError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return "Action failed. Try again.";
}

function isSignedIntentError(value: unknown): value is SignedIntentError {
  return value instanceof Error && (value as SignedIntentError).code !== undefined;
}
