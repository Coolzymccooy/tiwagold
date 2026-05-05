import { useCallback, useMemo, useState } from "react";
import { useBrokerConnections } from "@/services/broker";
import { useMt5Status } from "@/services/mt5Status";
import { useTrades } from "@/services/trades";
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
  actionError: string | null;
}

export function useTradeFeed(): UseTradeFeedResult {
  const [filter, setFilterState] = useState<TradeFeedFilter>("all");
  const [actionError] = useState<string | null>(null);

  const query = useTrades();
  const brokers = useBrokerConnections();
  const mt5 = useMt5Status();
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
    const liveAccount = mt5.data?.account;
    const liveEquity = liveAccount?.equity;
    const liveBalance = liveAccount?.balance;
    const fallback = brokers.data?.[0];
    return {
      equity: liveEquity ?? liveBalance ?? fallback?.equity ?? fallback?.balance ?? null,
      balance: liveBalance ?? fallback?.balance ?? null,
      currency: fallback?.currency ?? "USD",
      dailyPnlUsd: selectLivePortfolioPnlUsd(query.data),
    };
  }, [brokers.data, mt5.data, query.data]);

  const setFilter = useCallback((next: TradeFeedFilter) => {
    setFilterState(next);
  }, []);

  const refetch = useCallback(() => {
    query.refetch();
  }, [query]);

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
    actionError,
  };
}
