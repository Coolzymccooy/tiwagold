/**
 * Copilot service — bridges the mobile UI to the persona-overseer cloud API.
 *
 * Live path (USE_LIVE_BACKEND=true): hits /copilot/* on cloud-api over Bearer
 * JWT. Reuses the same handleChat brain Telegram uses, so context follows the
 * user across channels.
 *
 * Mock path: falls back to in-memory simulateFetch state so dev builds without
 * backend config still render a working tab.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  MOCK_COPILOT_SESSION,
  MOCK_COPILOT_SUGGESTED_PROMPTS,
} from "@/mocks/copilot";
import type {
  CopilotChatRequest,
  CopilotChatResponseChunk,
  CopilotConversation,
  CopilotMessage,
  CopilotSession,
  CopilotSuggestedPrompt,
} from "@/types/copilot";
import { useAuthStore } from "@/state/authStore";
import { authFetch, isLiveBackendEnabled } from "./liveBackend";
import { createId, nowIso, simulateFetch } from "./client";

export const copilotKeys = {
  conversations: ["copilot", "conversations"] as const,
  session: (id: string) => ["copilot", "session", id] as const,
  prompts: ["copilot", "prompts"] as const,
};

// ─── Mock state (dev fallback only) ─────────────────────────────────────────

const sessionStore = new Map<string, CopilotSession>();
sessionStore.set(MOCK_COPILOT_SESSION.id, {
  ...MOCK_COPILOT_SESSION,
  messages: MOCK_COPILOT_SESSION.messages.map((message) => ({ ...message })),
});

const conversationsStore: CopilotConversation[] = [
  {
    id: MOCK_COPILOT_SESSION.id,
    title: MOCK_COPILOT_SESSION.title,
    createdAt: MOCK_COPILOT_SESSION.createdAt,
    updatedAt: MOCK_COPILOT_SESSION.updatedAt,
    messageCount: MOCK_COPILOT_SESSION.messages.length,
    previewSnippet:
      "trd_3 is a high-conviction aggressive long at 2320.00. HTF trend on 4H is up…",
  },
  {
    id: "cps_session_0",
    title: "London open game plan",
    createdAt: "2026-04-12T05:30:00.000Z",
    updatedAt: "2026-04-12T06:05:00.000Z",
    messageCount: 6,
    previewSnippet:
      "Focus on the 2305 reclaim; DXY is soft into the European open.",
  },
];

function cloneSession(session: CopilotSession): CopilotSession {
  return {
    ...session,
    messages: session.messages.map((message) => ({ ...message })),
  };
}

function cloneConversation(value: CopilotConversation): CopilotConversation {
  return { ...value };
}

function generateAssistantReply(request: CopilotChatRequest): string {
  const { prompt, context } = request;
  if (context?.tradeId) {
    return `Reviewing ${context.tradeId}: thesis still holds pending London open. Structure intact, score unchanged. ${prompt}`;
  }
  if (context?.range) {
    return `Across the last ${context.range}: win rate holding, expectancy positive. Biggest leak is off-hours fills. ${prompt}`;
  }
  return `Thinking about: ${prompt}. Two-way risk until DXY confirms direction; stay patient for structure.`;
}

function upsertConversationSummary(
  conversationId: string,
  session: CopilotSession,
): void {
  const existing = conversationsStore.findIndex(
    (item) => item.id === conversationId,
  );
  const lastMessage = session.messages[session.messages.length - 1];
  const summary: CopilotConversation = {
    id: conversationId,
    title: session.title,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    messageCount: session.messages.length,
    previewSnippet: lastMessage ? lastMessage.content.slice(0, 80) : undefined,
  };
  if (existing >= 0) {
    conversationsStore[existing] = summary;
  } else {
    conversationsStore.unshift(summary);
  }
}

// ─── Live backend helpers ───────────────────────────────────────────────────

function getBearerOrThrow(): string {
  const token = useAuthStore.getState().session?.access?.value ?? null;
  if (!token) {
    throw new Error("Not signed in — cannot reach the live copilot backend");
  }
  return token;
}

export function fetchCopilotSessionLive(
  sessionId: string,
  bearerToken: string,
): Promise<CopilotSession> {
  return authFetch<CopilotSession>(
    `/copilot/sessions/${encodeURIComponent(sessionId)}`,
    { method: "GET", bearerToken },
  );
}

export function fetchCopilotConversationsLive(
  bearerToken: string,
): Promise<CopilotConversation[]> {
  return authFetch<CopilotConversation[]>("/copilot/conversations", {
    method: "GET",
    bearerToken,
  });
}

export function fetchCopilotPromptsLive(
  bearerToken: string,
): Promise<CopilotSuggestedPrompt[]> {
  return authFetch<CopilotSuggestedPrompt[]>("/copilot/suggested-prompts", {
    method: "GET",
    bearerToken,
  });
}

export function sendCopilotChatLive(
  request: CopilotChatRequest,
  bearerToken: string,
): Promise<CopilotChatResponseChunk> {
  return authFetch<CopilotChatResponseChunk>("/copilot/chat", {
    method: "POST",
    bearerToken,
    body: {
      prompt: request.prompt,
      ...(request.conversationId
        ? { conversationId: request.conversationId }
        : {}),
      ...(request.context ? { context: request.context } : {}),
    },
  });
}

// ─── Query hooks ────────────────────────────────────────────────────────────

export function useCopilotConversations(): UseQueryResult<
  CopilotConversation[],
  Error
> {
  return useQuery({
    queryKey: copilotKeys.conversations,
    queryFn: () => {
      if (isLiveBackendEnabled()) {
        return fetchCopilotConversationsLive(getBearerOrThrow());
      }
      return simulateFetch(() =>
        conversationsStore.map((item) => cloneConversation(item)),
      );
    },
    staleTime: 30_000,
  });
}

export function useCopilotSession(
  sessionId: string | undefined,
): UseQueryResult<CopilotSession, Error> {
  return useQuery({
    queryKey: sessionId
      ? copilotKeys.session(sessionId)
      : ["copilot", "session", "pending"],
    queryFn: () => {
      if (!sessionId) throw new Error("Missing session id");
      if (isLiveBackendEnabled()) {
        return fetchCopilotSessionLive(sessionId, getBearerOrThrow());
      }
      return simulateFetch(() => {
        const session = sessionStore.get(sessionId);
        if (!session) throw new Error("Copilot session not found");
        return cloneSession(session);
      });
    },
    enabled: Boolean(sessionId),
    staleTime: 10_000,
  });
}

export function useCopilotSuggestedPrompts(): UseQueryResult<
  CopilotSuggestedPrompt[],
  Error
> {
  return useQuery({
    queryKey: copilotKeys.prompts,
    queryFn: () => {
      if (isLiveBackendEnabled()) {
        return fetchCopilotPromptsLive(getBearerOrThrow());
      }
      return simulateFetch(() =>
        MOCK_COPILOT_SUGGESTED_PROMPTS.map((prompt) => ({ ...prompt })),
      );
    },
    staleTime: Infinity,
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export interface SendCopilotMessageInput {
  sessionId: string;
  content: string;
}

function chunkToAssistantMessage(
  chunk: CopilotChatResponseChunk,
): CopilotMessage {
  return {
    id: chunk.messageId,
    role: "assistant",
    content: chunk.deltaText,
    at: nowIso(),
    status: chunk.status,
    ...(chunk.citations ? { citations: chunk.citations } : {}),
  };
}

export function useSendCopilotMessage(): UseMutationResult<
  CopilotMessage,
  Error,
  SendCopilotMessageInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, content }: SendCopilotMessageInput) => {
      if (isLiveBackendEnabled()) {
        const chunk = await sendCopilotChatLive(
          { prompt: content, conversationId: sessionId },
          getBearerOrThrow(),
        );
        return chunkToAssistantMessage(chunk);
      }
      // Mock path mirrors the prior simulateFetch behaviour exactly.
      return simulateFetch<CopilotMessage>(() => {
        const session = sessionStore.get(sessionId);
        if (!session) throw new Error("Copilot session not found");
        const userMessage: CopilotMessage = {
          id: createId("msg"),
          role: "user",
          content,
          at: nowIso(),
          status: "complete",
        };
        const assistantMessage: CopilotMessage = {
          id: createId("msg"),
          role: "assistant",
          content: generateAssistantReply({ prompt: content }),
          at: nowIso(),
          status: "complete",
        };
        const updated: CopilotSession = {
          ...session,
          messages: [...session.messages, userMessage, assistantMessage],
          updatedAt: assistantMessage.at,
        };
        sessionStore.set(sessionId, updated);
        upsertConversationSummary(sessionId, updated);
        return assistantMessage;
      });
    },
    onSuccess: (_message, { sessionId }) => {
      // Live path: source of truth is the server — refetch for the real history
      // including the user message we just sent.
      // Mock path: optimistic state is already mutated; invalidate so the
      // session query rebuilds from sessionStore.
      queryClient.invalidateQueries({ queryKey: copilotKeys.session(sessionId) });
      queryClient.invalidateQueries({ queryKey: copilotKeys.conversations });
    },
  });
}

export function useCopilotChat(): UseMutationResult<
  CopilotChatResponseChunk,
  Error,
  CopilotChatRequest
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: CopilotChatRequest) => {
      if (isLiveBackendEnabled()) {
        return sendCopilotChatLive(request, getBearerOrThrow());
      }
      return simulateFetch<CopilotChatResponseChunk>(() => {
        const conversationId = request.conversationId ?? createId("cps");
        const existing = sessionStore.get(conversationId);
        const createdAt = existing?.createdAt ?? nowIso();
        const userMessage: CopilotMessage = {
          id: createId("msg"),
          role: "user",
          content: request.prompt,
          at: nowIso(),
          status: "complete",
        };
        const replyText = generateAssistantReply(request);
        const assistantMessage: CopilotMessage = {
          id: createId("msg"),
          role: "assistant",
          content: replyText,
          at: nowIso(),
          status: "complete",
          ...(request.context?.tradeId
            ? {
                citations: [
                  {
                    label: `Trade ${request.context.tradeId}`,
                    tradeId: request.context.tradeId,
                  },
                ],
              }
            : {}),
        };
        const session: CopilotSession = {
          id: conversationId,
          title: existing?.title ?? request.prompt.slice(0, 48),
          createdAt,
          updatedAt: assistantMessage.at,
          messages: existing
            ? [...existing.messages, userMessage, assistantMessage]
            : [userMessage, assistantMessage],
        };
        sessionStore.set(conversationId, session);
        upsertConversationSummary(conversationId, session);
        return {
          conversationId,
          messageId: assistantMessage.id,
          deltaText: replyText,
          status: "complete",
          ...(assistantMessage.citations
            ? { citations: assistantMessage.citations }
            : {}),
        };
      });
    },
    onSuccess: (chunk) => {
      queryClient.invalidateQueries({
        queryKey: copilotKeys.session(chunk.conversationId),
      });
      queryClient.invalidateQueries({ queryKey: copilotKeys.conversations });
    },
  });
}
