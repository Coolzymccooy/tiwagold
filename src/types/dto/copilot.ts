export type CopilotRoleDto = "system" | "user" | "assistant";
export type CopilotStatusDto = "queued" | "streaming" | "complete" | "error";

export interface CopilotCitationDto {
  label: string;
  url?: string | null;
  trade_id?: string | null;
}

export interface CopilotMessageDto {
  id: string;
  role: CopilotRoleDto;
  content: string;
  at: string;
  status: CopilotStatusDto;
  citations?: CopilotCitationDto[];
}

export interface CopilotConversationSummaryDto {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  preview_snippet?: string | null;
}

export interface CopilotConversationDetailDto {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: CopilotMessageDto[];
}

export interface CopilotSuggestedPromptDto {
  kind: "trade_review" | "macro_brief" | "session_plan" | "risk_check";
  label: string;
  prompt: string;
}

export interface CopilotChatRequestDto {
  conversation_id?: string | null;
  prompt: string;
  context?: {
    trade_id?: string | null;
    range?: "7d" | "30d" | "90d" | null;
  } | null;
}

export interface CopilotChatResponseChunkDto {
  conversation_id: string;
  message_id: string;
  delta_text: string;
  status: CopilotStatusDto;
  citations?: CopilotCitationDto[];
}

export interface CopilotAgentRunDto {
  id: string;
  userId?: string | null;
  channel: string;
  status: string;
  failureReason?: string | null;
  prompt: string;
  startedAt: string;
  completedAt?: string | null;
  synthesisReport?: string | null;
  agents: Array<{
    taskIndex: number;
    name: string;
    status: string;
    summary?: string | null;
    durationMs?: number | null;
    iterations?: number | null;
    apiCalls?: number | null;
    milestones: string[];
    resultText?: string | null;
    error?: string | null;
  }>;
}

export interface CopilotChatRunEnvelopeDto {
  kind: "run";
  conversationId: string;
  runId: string;
  placeholderMessageId: string;
  status: string;
}
