import { useCallback, useMemo } from "react";
import { useAnalyticsSummary } from "@/services/analytics";
import { toAnalyticsView } from "./selectors";
import type { AnalyticsView } from "./types";

export interface UseAnalyticsResult {
  view: AnalyticsView | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useAnalytics(): UseAnalyticsResult {
  const query = useAnalyticsSummary();

  const view = useMemo(() => toAnalyticsView(query.data), [query.data]);

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
