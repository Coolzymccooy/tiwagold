import { useCallback, useMemo, useState } from "react";
import {
  useExecuteTrade,
  useTrade,
  useUpdateTradeStatus,
} from "@/services/trades";
import {
  SignedIntentError,
  useRequestSignedIntent,
} from "@/services/signedIntent";
// Per-user pending-signal approval — signs a real P-256 intent and POSTs
// /trades/:id/approve. This is the live flow; the legacy mock requestSignedIntent
// (kept for `execute`) hard-throws backend_unavailable in production builds.
import { useApproveTrade } from "@/services/pendingTrades";
import { toTradeDetailView } from "./selectors";
import type { TradeDetailView } from "./types";

export type TradeDetailActionError = SignedIntentError | Error;

export interface UseTradeDetailResult {
  view: TradeDetailView | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  approve: () => void;
  execute: () => void;
  cancel: () => void;
  isApproving: boolean;
  isExecuting: boolean;
  isCancelling: boolean;
  isRequestingIntent: boolean;
  actionError: TradeDetailActionError | null;
}

export function useTradeDetail(id: string | undefined): UseTradeDetailResult {
  const query = useTrade(id);
  const approveMutation = useApproveTrade();
  const executeMutation = useExecuteTrade();
  const cancelMutation = useUpdateTradeStatus();
  const intentMutation = useRequestSignedIntent();
  const [actionError, setActionError] =
    useState<TradeDetailActionError | null>(null);

  const view = useMemo(
    () => (query.data ? toTradeDetailView(query.data) : undefined),
    [query.data],
  );

  const approve = useCallback(() => {
    if (!id) return;
    setActionError(null);
    void (async () => {
      try {
        // The pending-trade approve mutation mints the signed intent (P-256 via
        // liveSignedIntent) and POSTs /trades/:id/approve internally — no
        // separate mock intent request. This is what restores live approvals.
        await approveMutation.mutateAsync({ tradeId: id });
      } catch (error: unknown) {
        setActionError(toActionError(error));
      }
    })();
  }, [id, approveMutation]);

  const execute = useCallback(() => {
    if (!id) return;
    setActionError(null);
    void (async () => {
      try {
        const intent = await intentMutation.mutateAsync({
          purpose: "trade.execute",
          subjectId: id,
        });
        await executeMutation.mutateAsync({
          id,
          intentToken: intent.token,
        });
      } catch (error: unknown) {
        setActionError(toActionError(error));
      }
    })();
  }, [id, intentMutation, executeMutation]);

  const cancel = useCallback(() => {
    if (!id) return;
    setActionError(null);
    cancelMutation.mutate(
      { id, status: "cancelled", note: "Cancelled by operator" },
      {
        onError: (error) => setActionError(toActionError(error)),
      },
    );
  }, [id, cancelMutation]);

  const refetch = useCallback(() => {
    void query.refetch();
  }, [query]);

  return {
    view,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ?? null,
    refetch,
    approve,
    execute,
    cancel,
    isApproving: approveMutation.isPending,
    isExecuting: executeMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isRequestingIntent: intentMutation.isPending,
    actionError,
  };
}

function toActionError(error: unknown): TradeDetailActionError {
  if (error instanceof SignedIntentError) return error;
  if (error instanceof Error) return error;
  return new Error("Unexpected error");
}
