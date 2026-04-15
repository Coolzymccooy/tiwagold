import { useCallback, useMemo, useState } from "react";
import { useTrades } from "@/services/trades";
import { selectTradeFeed } from "./selectors";
import type { TradeFeedFilter, TradeFeedItem } from "./types";

export interface UseTradeFeedResult {
  items: TradeFeedItem[];
  filter: TradeFeedFilter;
  setFilter: (filter: TradeFeedFilter) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useTradeFeed(): UseTradeFeedResult {
  const [filter, setFilterState] = useState<TradeFeedFilter>("all");
  const query = useTrades();

  const items = useMemo(
    () => selectTradeFeed(query.data, filter),
    [query.data, filter],
  );

  const setFilter = useCallback((next: TradeFeedFilter) => {
    setFilterState(next);
  }, []);

  const refetch = useCallback(() => {
    query.refetch();
  }, [query]);

  return {
    items,
    filter,
    setFilter,
    isLoading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    isError: query.isError,
    refetch,
  };
}
