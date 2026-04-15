import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { MOCK_MACRO_EVENTS } from "@/mocks/macro";
import type {
  MacroRadarEvent,
  MacroRadarEventDetail,
} from "@/types/macro";
import { nowIso, simulateFetch } from "./client";

export const macroKeys = {
  all: ["macro"] as const,
  detail: (id: string) => ["macro", "event", id] as const,
};

function findEvent(id: string): MacroRadarEvent {
  const match = MOCK_MACRO_EVENTS.find((event) => event.id === id);
  if (!match) throw new Error("Macro event not found");
  return match;
}

function synthesizeDetail(event: MacroRadarEvent): MacroRadarEventDetail {
  const narrative =
    event.goldBias === "bullish"
      ? `${event.summary} Bias favors continuation higher on confirmation; manage risk tightly through the release window.`
      : event.goldBias === "bearish"
        ? `${event.summary} Expect pressure into the release; only take counter-trend setups after reclaim of structure.`
        : `${event.summary} Two-way risk — wait for initial reaction to resolve before committing.`;
  const keyLevels =
    event.category === "dxy"
      ? { resistance: 104.2, support: 103.4, invalidation: 104.6 }
      : event.impact === "high"
        ? { invalidation: undefined }
        : undefined;
  return {
    ...event,
    narrative,
    ...(keyLevels ? { keyLevels } : {}),
    updatedAt: nowIso(),
  };
}

export function useMacroEvents(): UseQueryResult<MacroRadarEvent[], Error> {
  return useQuery({
    queryKey: macroKeys.all,
    queryFn: () => simulateFetch(() => MOCK_MACRO_EVENTS.map((e) => ({ ...e }))),
    staleTime: 60_000,
  });
}

export function useMacroEventDetail(
  id: string | undefined,
): UseQueryResult<MacroRadarEventDetail, Error> {
  return useQuery({
    queryKey: id ? macroKeys.detail(id) : ["macro", "event", "pending"],
    queryFn: () =>
      simulateFetch<MacroRadarEventDetail>(() => {
        if (!id) throw new Error("Missing macro event id");
        return synthesizeDetail(findEvent(id));
      }),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}
