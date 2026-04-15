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
