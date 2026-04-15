import type {
  CopilotChatRequestDto,
  CopilotChatResponseChunkDto,
  CopilotCitationDto,
  CopilotConversationDetailDto,
  CopilotConversationSummaryDto,
  CopilotMessageDto,
  CopilotSuggestedPromptDto,
} from "@/types/dto";
import type {
  CopilotChatRequest,
  CopilotChatResponseChunk,
  CopilotCitation,
  CopilotConversation,
  CopilotMessage,
  CopilotSession,
  CopilotSuggestedPrompt,
} from "@/types/copilot";

import { fromOptional, toOptional } from "./primitives";

export function copilotCitationFromDto(
  dto: CopilotCitationDto,
): CopilotCitation {
  return {
    label: dto.label,
    url: toOptional(dto.url),
    tradeId: toOptional(dto.trade_id),
  };
}

export function copilotCitationToDto(
  domain: CopilotCitation,
): CopilotCitationDto {
  return {
    label: domain.label,
    url: fromOptional(domain.url),
    trade_id: fromOptional(domain.tradeId),
  };
}

export function copilotMessageFromDto(dto: CopilotMessageDto): CopilotMessage {
  return {
    id: dto.id,
    role: dto.role,
    content: dto.content,
    at: dto.at,
    status: dto.status,
    citations: dto.citations?.map(copilotCitationFromDto),
  };
}

export function copilotMessageToDto(domain: CopilotMessage): CopilotMessageDto {
  return {
    id: domain.id,
    role: domain.role,
    content: domain.content,
    at: domain.at,
    status: domain.status,
    citations: domain.citations?.map(copilotCitationToDto),
  };
}

export function copilotConversationFromDto(
  dto: CopilotConversationSummaryDto,
): CopilotConversation {
  return {
    id: dto.id,
    title: dto.title,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    messageCount: dto.message_count,
    previewSnippet: toOptional(dto.preview_snippet),
  };
}

export function copilotSessionFromDto(
  dto: CopilotConversationDetailDto,
): CopilotSession {
  return {
    id: dto.id,
    title: dto.title,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    messages: dto.messages.map(copilotMessageFromDto),
  };
}

export function copilotSuggestedPromptFromDto(
  dto: CopilotSuggestedPromptDto,
): CopilotSuggestedPrompt {
  return {
    kind: dto.kind,
    label: dto.label,
    prompt: dto.prompt,
  };
}

export function copilotChatRequestToDto(
  input: CopilotChatRequest,
): CopilotChatRequestDto {
  const context = input.context
    ? {
        trade_id: fromOptional(input.context.tradeId),
        range: input.context.range ?? null,
      }
    : null;
  return {
    conversation_id: fromOptional(input.conversationId),
    prompt: input.prompt,
    context,
  };
}

export function copilotChatChunkFromDto(
  dto: CopilotChatResponseChunkDto,
): CopilotChatResponseChunk {
  return {
    conversationId: dto.conversation_id,
    messageId: dto.message_id,
    deltaText: dto.delta_text,
    status: dto.status,
    citations: dto.citations?.map(copilotCitationFromDto),
  };
}
