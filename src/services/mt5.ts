import Constants from "expo-constants";
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { useConnectBroker, brokerKeys } from "./broker";
import { useRequestSignedIntent } from "./signedIntent";
import type { BrokerConnection } from "@/types/broker";

export type MT5Server = "MetaQuotes-Demo" | "ICMarketsSC-Demo" | "ICMarketsSC-Live";

export const MT5_SERVERS: readonly MT5Server[] = [
  "MetaQuotes-Demo",
  "ICMarketsSC-Demo",
  "ICMarketsSC-Live",
];

export interface MT5ConnectInput {
  accountId: string;
  password: string;
  server: MT5Server;
}

export interface MT5BridgeConfig {
  baseUrl?: string;
  apiKey?: string;
}

function readBridgeConfig(): MT5BridgeConfig {
  const extra = Constants.expoConfig?.extra ?? {};
  return {
    baseUrl: typeof extra.MT5_BRIDGE_BASE_URL === "string" ? extra.MT5_BRIDGE_BASE_URL : undefined,
    apiKey: typeof extra.MT5_BRIDGE_API_KEY === "string" ? extra.MT5_BRIDGE_API_KEY : undefined,
  };
}

async function postToBridge(
  path: string,
  body: unknown,
  config: MT5BridgeConfig,
): Promise<unknown> {
  if (!config.baseUrl) {
    throw new Error("MT5 bridge not configured. Set MT5_BRIDGE_BASE_URL in app config.");
  }
  const response = await fetch(`${config.baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`MT5 bridge ${response.status}: ${message}`);
  }
  return response.json();
}

export interface UseConnectMT5Result {
  connect: (input: MT5ConnectInput) => Promise<BrokerConnection>;
  isConnecting: boolean;
  error: Error | null;
}

export function useConnectMT5(): UseConnectMT5Result {
  const intentMutation = useRequestSignedIntent();
  const connectMutation = useConnectBroker();

  const connect = async (input: MT5ConnectInput): Promise<BrokerConnection> => {
    const intent = await intentMutation.mutateAsync({
      purpose: "broker.connect",
      subjectId: `mt5:${input.accountId}@${input.server}`,
    });
    const config = readBridgeConfig();
    if (config.baseUrl) {
      await postToBridge(
        "/v1/mt5/connect",
        {
          account_id: input.accountId,
          password: input.password,
          server: input.server,
          intent_token: intent.token,
        },
        config,
      );
    }
    return connectMutation.mutateAsync({
      intentToken: intent.token,
      kind: "mt5",
      accountLabel: `MT5 · ${input.server}`,
      login: input.accountId,
      password: input.password,
      server: input.server,
      environment: input.server.toLowerCase().includes("live") ? "live" : "demo",
    });
  };

  return {
    connect,
    isConnecting: intentMutation.isPending || connectMutation.isPending,
    error: intentMutation.error ?? connectMutation.error ?? null,
  };
}

export interface MT5AccountSnapshot {
  balance: number;
  equity: number;
  marginFree: number;
  currency: string;
  syncedAt: string;
}

export function useRefreshMT5Snapshot(): UseMutationResult<
  MT5AccountSnapshot,
  Error,
  { connectionId: string }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ connectionId }) => {
      const config = readBridgeConfig();
      if (!config.baseUrl) {
        throw new Error("MT5 bridge not configured");
      }
      const result = (await postToBridge(
        "/v1/mt5/snapshot",
        { connection_id: connectionId },
        config,
      )) as MT5AccountSnapshot;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brokerKeys.all });
    },
  });
}
