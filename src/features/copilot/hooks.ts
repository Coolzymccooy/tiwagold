import { useCallback, useMemo, useState } from "react";
import {
  useCopilotSession,
  useCopilotSuggestedPrompts,
  useSendCopilotMessage,
} from "@/services/copilot";
import { toCopilotView } from "./selectors";
import type { CopilotView } from "./types";

const DEFAULT_SESSION_ID = "cps_session_1";

export interface UseCopilotResult {
  sessionId: string;
  view: CopilotView | undefined;
  draft: string;
  setDraft: (value: string) => void;
  send: () => void;
  usePrompt: (prompt: string) => void;
  isLoading: boolean;
  isSending: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCopilot(sessionId: string = DEFAULT_SESSION_ID): UseCopilotResult {
  const sessionQuery = useCopilotSession(sessionId);
  const promptsQuery = useCopilotSuggestedPrompts();
  const sendMutation = useSendCopilotMessage();
  const [draft, setDraft] = useState("");

  const view = useMemo(
    () => toCopilotView(sessionQuery.data, promptsQuery.data),
    [sessionQuery.data, promptsQuery.data],
  );

  const send = useCallback(() => {
    const content = draft.trim();
    if (!content || sendMutation.isPending) return;
    sendMutation.mutate({ sessionId, content });
    setDraft("");
  }, [draft, sendMutation, sessionId]);

  const usePrompt = useCallback(
    (prompt: string) => {
      setDraft(prompt);
    },
    [],
  );

  const refetch = useCallback(() => {
    void sessionQuery.refetch();
    void promptsQuery.refetch();
  }, [sessionQuery, promptsQuery]);

  return {
    sessionId,
    view,
    draft,
    setDraft,
    send,
    usePrompt,
    isLoading: sessionQuery.isLoading,
    isSending: sendMutation.isPending,
    isError: sessionQuery.isError,
    error: sessionQuery.error ?? null,
    refetch,
  };
}
