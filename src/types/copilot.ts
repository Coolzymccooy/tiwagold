export type CopilotRole = "system" | "user" | "assistant";

export type CopilotStatus = "queued" | "streaming" | "complete" | "error";

export interface CopilotCitation {
  label: string;
  url?: string;
  tradeId?: string;
}

export interface CopilotMessage {
  id: string;
  role: CopilotRole;
  content: string;
  at: string;
  status: CopilotStatus;
  citations?: CopilotCitation[];
}

export interface CopilotSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: CopilotMessage[];
}

export interface CopilotConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  previewSnippet?: string;
}

export interface CopilotChatRequest {
  conversationId?: string;
  prompt: string;
  context?: {
    tradeId?: string;
    range?: "7d" | "30d" | "90d";
  };
}

export interface CopilotChatResponseChunk {
  conversationId: string;
  messageId: string;
  deltaText: string;
  status: CopilotStatus;
  citations?: CopilotCitation[];
}

export type CopilotSuggestedPromptKind =
  | "trade_review"
  | "macro_brief"
  | "session_plan"
  | "risk_check";

export interface CopilotSuggestedPrompt {
  kind: CopilotSuggestedPromptKind;
  label: string;
  prompt: string;
}

export type CopilotAgentRunStatus =
  | "planning"
  | "running"
  | "synthesizing"
  | "completed"
  | "failed"
  | "aborted";

export type CopilotAgentTaskStatus = "queued" | "running" | "completed" | "failed";

export type CopilotRunChannel = "telegram" | "copilot" | "mcp";

export interface CopilotAgentRunTask {
  taskIndex: number;
  name: string;
  status: CopilotAgentTaskStatus;
  summary?: string;
  durationMs?: number;
  iterations?: number;
  apiCalls?: number;
  milestones: string[];
  resultText?: string;
  error?: string;
}

export interface CopilotAgentRun {
  id: string;
  status: CopilotAgentRunStatus;
  failureReason?: string;
  channel: CopilotRunChannel;
  prompt: string;
  startedAt: string;
  completedAt?: string;
  agents: CopilotAgentRunTask[];
  synthesisReport?: string;
}

/**
 * v2 chat response can be either a single-bubble message OR a runId envelope
 * pointing to a multi-agent dispatch. Discriminated by `kind`.
 *
 * The existing single-bubble `CopilotChatResponseChunk` type already has
 * `conversationId`, `messageId`, `deltaText`, `status`. The "run" branch
 * carries a runId the client polls via useCopilotAgentRun.
 */
export interface CopilotChatRunEnvelope {
  kind: "run";
  conversationId: string;
  runId: string;
  placeholderMessageId: string;
  status: "running";
}
