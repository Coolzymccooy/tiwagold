import type {
  CopilotMessage,
  CopilotSession,
  CopilotSuggestedPrompt,
} from "@/types/copilot";
import type {
  CopilotMessageRow,
  CopilotMessageTone,
  CopilotSuggestedPromptRow,
  CopilotView,
} from "./types";

const FALLBACK_SUBTITLE = "Focused XAU/USD assistant";

export function toCopilotView(
  session: CopilotSession | undefined,
  prompts: CopilotSuggestedPrompt[] | undefined,
): CopilotView | undefined {
  if (!session) return undefined;
  const visibleMessages = session.messages.filter((m) => m.role !== "system");
  return {
    sessionId: session.id,
    title: session.title,
    subtitle: FALLBACK_SUBTITLE,
    messages: visibleMessages.map(toMessageRow),
    suggestedPrompts: (prompts ?? []).map(toPromptRow),
    hasMessages: visibleMessages.length > 0,
  };
}

function toMessageRow(message: CopilotMessage): CopilotMessageRow {
  const tone = resolveTone(message.role);
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    timestampLabel: formatTimestamp(message.at),
    status: message.status,
    citationLabels: (message.citations ?? []).map((c) => c.label),
    isAssistant: message.role === "assistant",
    isUser: message.role === "user",
    isSystem: message.role === "system",
    tone,
  };
}

function toPromptRow(prompt: CopilotSuggestedPrompt): CopilotSuggestedPromptRow {
  return {
    kind: prompt.kind,
    label: prompt.label,
    prompt: prompt.prompt,
  };
}

function resolveTone(role: CopilotMessage["role"]): CopilotMessageTone {
  if (role === "user") return "accent";
  if (role === "assistant") return "primary";
  return "muted";
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}
