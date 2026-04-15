import type {
  MacroRadarEventDetailDto,
  MacroRadarEventDto,
  MacroRadarListResponseDto,
} from "@/types/dto";
import type {
  MacroRadarEvent,
  MacroRadarEventDetail,
} from "@/types/macro";

import { toMoneyOrUndefined, toOptional } from "./primitives";

export function macroEventFromDto(dto: MacroRadarEventDto): MacroRadarEvent {
  return {
    id: dto.id,
    at: dto.at,
    title: dto.title,
    summary: dto.summary,
    category: dto.category,
    impact: dto.impact,
    goldBias: dto.gold_bias,
    source: toOptional(dto.source),
    url: toOptional(dto.url),
  };
}

export function macroEventDetailFromDto(
  dto: MacroRadarEventDetailDto,
): MacroRadarEventDetail {
  const base = macroEventFromDto(dto);
  const levels = dto.key_levels ?? undefined;
  return {
    ...base,
    narrative: dto.narrative,
    keyLevels: levels
      ? {
          support: toMoneyOrUndefined(levels.support),
          resistance: toMoneyOrUndefined(levels.resistance),
          invalidation: toMoneyOrUndefined(levels.invalidation),
        }
      : undefined,
    relatedTradeIds: dto.related_trade_ids,
    updatedAt: dto.updated_at,
  };
}

export function macroEventListFromDto(
  dto: MacroRadarListResponseDto,
): { events: MacroRadarEvent[]; nextCursor?: string } {
  return {
    events: dto.events.map(macroEventFromDto),
    nextCursor: toOptional(dto.next_cursor),
  };
}
