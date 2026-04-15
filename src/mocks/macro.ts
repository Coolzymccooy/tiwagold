import type { MacroRadarEvent } from "@/types/macro";

export const MOCK_MACRO_EVENTS: MacroRadarEvent[] = [
  {
    id: "mac_cpi_apr",
    at: "2026-04-14T12:30:00.000Z",
    title: "US CPI m/m — April print",
    summary:
      "Consensus 0.3% m/m. Upside surprise weakens gold as yields bid; downside surprise fuels gold continuation.",
    category: "cpi",
    impact: "high",
    goldBias: "neutral",
    source: "BLS",
  },
  {
    id: "mac_fed_minutes",
    at: "2026-04-15T18:00:00.000Z",
    title: "FOMC minutes release",
    summary:
      "Look for language on the pace of balance sheet runoff and any shift toward an earlier cut cadence.",
    category: "fed",
    impact: "high",
    goldBias: "bullish",
    source: "Federal Reserve",
  },
  {
    id: "mac_dxy_breakout",
    at: "2026-04-14T01:00:00.000Z",
    title: "DXY rejects 104.20 resistance",
    summary:
      "Dollar index failed to hold above multi-week resistance overnight, favoring continued gold bid.",
    category: "dxy",
    impact: "medium",
    goldBias: "bullish",
  },
  {
    id: "mac_geopol_me",
    at: "2026-04-13T22:40:00.000Z",
    title: "Middle East escalation headlines",
    summary:
      "Haven flows active into Asian open. Watch for news-driven spikes into US cash session.",
    category: "geopolitics",
    impact: "medium",
    goldBias: "bullish",
  },
  {
    id: "mac_nfp_preview",
    at: "2026-05-02T12:30:00.000Z",
    title: "NFP preview — May",
    summary:
      "Consensus +175k. Labor softening trend intact; a big miss would reinforce rate-cut pricing and lift gold.",
    category: "nfp",
    impact: "high",
    goldBias: "neutral",
  },
];
