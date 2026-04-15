import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  MOCK_ENGINE_SETTINGS,
  MOCK_RISK_SETTINGS,
} from "@/mocks/settings";
import type {
  EngineSettings,
  EngineToggle,
  RiskSettings,
} from "@/types/settings";
import type { EngineTier } from "@/types/trade";
import { simulateFetch } from "./client";

export const settingsKeys = {
  risk: ["settings", "risk"] as const,
  engine: ["settings", "engine"] as const,
};

export type RiskSettingsPatch = Partial<RiskSettings>;

export interface EngineToggleUpdate {
  tier: EngineTier;
  enabled?: boolean;
  minScore?: number;
}

export interface EngineSettingsPatch {
  engines?: EngineToggleUpdate[];
  autoApprove?: boolean;
  autoApproveMinScore?: number;
  cooldownMinutes?: number;
}

let riskStore: RiskSettings = { ...MOCK_RISK_SETTINGS };
let engineStore: EngineSettings = {
  ...MOCK_ENGINE_SETTINGS,
  engines: MOCK_ENGINE_SETTINGS.engines.map((toggle) => ({ ...toggle })),
};

function applyRiskPatch(
  current: RiskSettings,
  patch: RiskSettingsPatch,
): RiskSettings {
  return {
    ...current,
    ...(patch.minRR !== undefined ? { minRR: patch.minRR } : {}),
    ...(patch.maxRiskPercent !== undefined
      ? { maxRiskPercent: patch.maxRiskPercent }
      : {}),
    ...(patch.allowedSessions !== undefined
      ? { allowedSessions: [...patch.allowedSessions] }
      : {}),
    ...(patch.maxDataAgeMinutes !== undefined
      ? { maxDataAgeMinutes: patch.maxDataAgeMinutes }
      : {}),
    ...(patch.maxDailyDrawdownPct !== undefined
      ? { maxDailyDrawdownPct: patch.maxDailyDrawdownPct }
      : {}),
    ...(patch.maxOpenPositions !== undefined
      ? { maxOpenPositions: patch.maxOpenPositions }
      : {}),
    ...(patch.cooldownAfterLossMinutes !== undefined
      ? { cooldownAfterLossMinutes: patch.cooldownAfterLossMinutes }
      : {}),
  };
}

function mergeEngineToggles(
  current: EngineToggle[],
  updates: EngineToggleUpdate[],
): EngineToggle[] {
  const byTier = new Map<EngineTier, EngineToggle>();
  current.forEach((toggle) => byTier.set(toggle.tier, { ...toggle }));
  updates.forEach((update) => {
    const existing = byTier.get(update.tier);
    if (!existing) return;
    byTier.set(update.tier, {
      ...existing,
      ...(update.enabled !== undefined ? { enabled: update.enabled } : {}),
      ...(update.minScore !== undefined ? { minScore: update.minScore } : {}),
    });
  });
  return current.map((toggle) => byTier.get(toggle.tier) ?? toggle);
}

function applyEnginePatch(
  current: EngineSettings,
  patch: EngineSettingsPatch,
): EngineSettings {
  return {
    ...current,
    ...(patch.engines !== undefined
      ? { engines: mergeEngineToggles(current.engines, patch.engines) }
      : {}),
    ...(patch.autoApprove !== undefined
      ? { autoApprove: patch.autoApprove }
      : {}),
    ...(patch.autoApproveMinScore !== undefined
      ? { autoApproveMinScore: patch.autoApproveMinScore }
      : {}),
    ...(patch.cooldownMinutes !== undefined
      ? { cooldownMinutes: patch.cooldownMinutes }
      : {}),
  };
}

function cloneRisk(value: RiskSettings): RiskSettings {
  return { ...value, allowedSessions: [...value.allowedSessions] };
}

function cloneEngine(value: EngineSettings): EngineSettings {
  return { ...value, engines: value.engines.map((toggle) => ({ ...toggle })) };
}

export function useRiskSettings(): UseQueryResult<RiskSettings, Error> {
  return useQuery({
    queryKey: settingsKeys.risk,
    queryFn: () => simulateFetch(() => cloneRisk(riskStore)),
    staleTime: 60_000,
  });
}

export function useUpdateRiskSettings(): UseMutationResult<
  RiskSettings,
  Error,
  RiskSettingsPatch
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: RiskSettingsPatch) =>
      simulateFetch<RiskSettings>(() => {
        riskStore = applyRiskPatch(riskStore, patch);
        return cloneRisk(riskStore);
      }),
    onSuccess: (settings) => {
      queryClient.setQueryData(settingsKeys.risk, settings);
    },
  });
}

export function useEngineSettings(): UseQueryResult<EngineSettings, Error> {
  return useQuery({
    queryKey: settingsKeys.engine,
    queryFn: () => simulateFetch(() => cloneEngine(engineStore)),
    staleTime: 60_000,
  });
}

export function useUpdateEngineSettings(): UseMutationResult<
  EngineSettings,
  Error,
  EngineSettingsPatch
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: EngineSettingsPatch) =>
      simulateFetch<EngineSettings>(() => {
        engineStore = applyEnginePatch(engineStore, patch);
        return cloneEngine(engineStore);
      }),
    onSuccess: (settings) => {
      queryClient.setQueryData(settingsKeys.engine, settings);
    },
  });
}
