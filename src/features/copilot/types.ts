import type {
  CopilotMessage,
  CopilotSession,
  CopilotSuggestedPrompt,
} from "@/types/copilot";

export type CopilotMessageTone = "muted" | "primary" | "accent";

export interface CopilotMessageRow {
  id: string;
  role: CopilotMessage["role"];
  content: string;
  timestampLabel: string;
  status: CopilotMessage["status"];
  citationLabels: string[];
  isAssistant: boolean;
  isUser: boolean;
  isSystem: boolean;
  tone: CopilotMessageTone;
  runId?: string;
}

export interface CopilotSuggestedPromptRow {
  kind: CopilotSuggestedPrompt["kind"];
  label: string;
  prompt: string;
}

export interface CopilotView {
  sessionId: string;
  title: string;
  subtitle: string;
  messages: CopilotMessageRow[];
  suggestedPrompts: CopilotSuggestedPromptRow[];
  hasMessages: boolean;
}

export type { CopilotSession, CopilotSuggestedPrompt };
