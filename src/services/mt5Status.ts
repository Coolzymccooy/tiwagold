import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { MOCK_MT5_STATUS_ONLINE } from "@/mocks/mt5-status";
import {
  parseMt5StatusResponse,
  type Mt5StatusResponseDto,
} from "@/types/dto/mt5-status";
import { simulateFetch } from "./client";
import { isLiveBackendEnabled, liveFetch } from "./liveBackend";

const MT5_STATUS_PATH = "/trading/mt5-status";

export const mt5StatusKeys = {
  all: ["mt5", "status"] as const,
};

async function fetchMt5StatusLive(): Promise<Mt5StatusResponseDto> {
  const raw = await liveFetch<unknown>(MT5_STATUS_PATH);
  return parseMt5StatusResponse(raw);
}

export function useMt5Status(): UseQueryResult<Mt5StatusResponseDto, Error> {
  return useQuery({
    queryKey: mt5StatusKeys.all,
    queryFn: () =>
      isLiveBackendEnabled()
        ? fetchMt5StatusLive()
        : simulateFetch<Mt5StatusResponseDto>(() => MOCK_MT5_STATUS_ONLINE),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
