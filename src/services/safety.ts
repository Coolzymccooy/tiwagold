import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  MOCK_KILL_SWITCH_ARMED,
  MOCK_KILL_SWITCH_CONFIRMATION_RESULT,
  MOCK_KILL_SWITCH_TRIPPED,
} from "@/mocks/safety";
import type {
  KillSwitchConfirmationInput,
  KillSwitchConfirmationResult,
  KillSwitchStatus,
} from "@/types/safety";
import { nowIso, simulateFetch } from "./client";
import { assertSignedIntentInProduction } from "./signedIntent";

export const safetyKeys = {
  status: ["safety", "killSwitch"] as const,
};

const REQUIRED_PHRASE = "STOP ALL TRADING";

let killSwitchState: KillSwitchStatus = { ...MOCK_KILL_SWITCH_ARMED };

export function useKillSwitchStatus(): UseQueryResult<KillSwitchStatus, Error> {
  return useQuery({
    queryKey: safetyKeys.status,
    queryFn: () => simulateFetch(() => ({ ...killSwitchState })),
    staleTime: 10_000,
  });
}

export function useConfirmKillSwitch(): UseMutationResult<
  KillSwitchConfirmationResult,
  Error,
  KillSwitchConfirmationInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: KillSwitchConfirmationInput) => {
      assertSignedIntentInProduction(input.intentToken);
      return simulateFetch<KillSwitchConfirmationResult>(() => {
        if (!input.intentToken) {
          throw new Error("Missing signed intent token");
        }
        if (input.confirmationPhrase !== REQUIRED_PHRASE) {
          throw new Error("Confirmation phrase mismatch");
        }
        const completedAt = nowIso();
        const trippedStatus: KillSwitchStatus = {
          ...MOCK_KILL_SWITCH_TRIPPED,
          trippedAt: completedAt,
          trippedReason: input.reason ?? "user_manual",
          trippedBy: "user",
        };
        killSwitchState = trippedStatus;
        return {
          ...MOCK_KILL_SWITCH_CONFIRMATION_RESULT,
          status: trippedStatus,
          completedAt,
        };
      });
    },
    onSuccess: (result) => {
      queryClient.setQueryData(safetyKeys.status, result.status);
      queryClient.invalidateQueries({ queryKey: safetyKeys.status });
    },
  });
}
