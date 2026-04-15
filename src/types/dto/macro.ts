export type MacroImpactDto = "low" | "medium" | "high";

export type MacroCategoryDto =
  | "fed"
  | "cpi"
  | "nfp"
  | "geopolitics"
  | "dxy"
  | "yields"
  | "gold_flows"
  | "central_bank";

export interface MacroRadarEventDto {
  id: string;
  at: string;
  title: string;
  summary: string;
  category: MacroCategoryDto;
  impact: MacroImpactDto;
  gold_bias: "bullish" | "bearish" | "neutral";
  source?: string | null;
  url?: string | null;
}

export interface MacroRadarEventDetailDto extends MacroRadarEventDto {
  narrative: string;
  key_levels?: {
    support?: string | null;
    resistance?: string | null;
    invalidation?: string | null;
  } | null;
  related_trade_ids?: string[];
  updated_at: string;
}

export interface MacroRadarListResponseDto {
  events: MacroRadarEventDto[];
  next_cursor?: string | null;
}
