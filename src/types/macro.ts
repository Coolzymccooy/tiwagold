export type MacroImpact = "low" | "medium" | "high";

export type MacroCategory =
  | "fed"
  | "cpi"
  | "nfp"
  | "geopolitics"
  | "dxy"
  | "yields"
  | "gold_flows"
  | "central_bank";

export interface MacroRadarEvent {
  id: string;
  at: string;
  title: string;
  summary: string;
  category: MacroCategory;
  impact: MacroImpact;
  goldBias: "bullish" | "bearish" | "neutral";
  source?: string;
  url?: string;
}

export interface MacroRadarEventDetail extends MacroRadarEvent {
  narrative: string;
  keyLevels?: {
    support?: number;
    resistance?: number;
    invalidation?: number;
  };
  relatedTradeIds?: string[];
  updatedAt: string;
}
