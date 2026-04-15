import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  MOCK_BROKER_CONNECTIONS,
  MOCK_BROKER_CONNECTION_TEST_FAIL,
  MOCK_BROKER_CONNECTION_TEST_OK,
} from "@/mocks/broker";
import type {
  BrokerConnection,
  BrokerConnectionInput,
  BrokerConnectionPatch,
  BrokerConnectionTestResult,
} from "@/types/broker";
import { createId, nowIso, simulateFetch } from "./client";
import { assertSignedIntentInProduction } from "./signedIntent";

export const brokerKeys = {
  all: ["broker", "connections"] as const,
  detail: (id: string) => ["broker", "connection", id] as const,
  test: (id: string) => ["broker", "connection", id, "test"] as const,
};

const brokerStore: BrokerConnection[] = MOCK_BROKER_CONNECTIONS.map((c) => ({ ...c }));

function findConnection(id: string): BrokerConnection {
  const match = brokerStore.find((c) => c.connectionId === id);
  if (!match) throw new Error("Broker connection not found");
  return match;
}

export function useBrokerConnections(): UseQueryResult<BrokerConnection[], Error> {
  return useQuery({
    queryKey: brokerKeys.all,
    queryFn: () => simulateFetch(() => brokerStore.map((c) => ({ ...c }))),
    staleTime: 30_000,
  });
}

export function useBrokerConnection(
  id: string | undefined,
): UseQueryResult<BrokerConnection, Error> {
  return useQuery({
    queryKey: id ? brokerKeys.detail(id) : ["broker", "connection", "pending"],
    queryFn: () =>
      simulateFetch<BrokerConnection>(() => {
        if (!id) throw new Error("Missing connection id");
        return { ...findConnection(id) };
      }),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useConnectBroker(): UseMutationResult<
  BrokerConnection,
  Error,
  BrokerConnectionInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BrokerConnectionInput) => {
      assertSignedIntentInProduction(input.intentToken);
      return simulateFetch<BrokerConnection>(() => {
        const connection: BrokerConnection = {
          connectionId: createId("brk"),
          kind: input.kind,
          accountLabel: input.accountLabel,
          status: "connected",
          connected: true,
          lastSyncedAt: nowIso(),
          currency: "USD",
        };
        brokerStore.push(connection);
        return { ...connection };
      });
    },
    onSuccess: (connection) => {
      queryClient.invalidateQueries({ queryKey: brokerKeys.all });
      queryClient.setQueryData(brokerKeys.detail(connection.connectionId), connection);
    },
  });
}

export interface DisconnectBrokerInput {
  connectionId: string;
}

export function useDisconnectBroker(): UseMutationResult<
  void,
  Error,
  DisconnectBrokerInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ connectionId }: DisconnectBrokerInput) =>
      simulateFetch<void>(() => {
        const index = brokerStore.findIndex((c) => c.connectionId === connectionId);
        if (index === -1) throw new Error("Broker connection not found");
        brokerStore.splice(index, 1);
      }),
    onSuccess: (_, { connectionId }) => {
      queryClient.invalidateQueries({ queryKey: brokerKeys.all });
      queryClient.removeQueries({ queryKey: brokerKeys.detail(connectionId) });
    },
  });
}

export interface UpdateBrokerConnectionInput {
  connectionId: string;
  patch: BrokerConnectionPatch;
}

export function useUpdateBrokerConnection(): UseMutationResult<
  BrokerConnection,
  Error,
  UpdateBrokerConnectionInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ connectionId, patch }: UpdateBrokerConnectionInput) =>
      simulateFetch<BrokerConnection>(() => {
        const existing = findConnection(connectionId);
        const updated: BrokerConnection = {
          ...existing,
          ...(patch.accountLabel !== undefined ? { accountLabel: patch.accountLabel } : {}),
          lastSyncedAt: nowIso(),
        };
        const index = brokerStore.findIndex((c) => c.connectionId === connectionId);
        if (index !== -1) brokerStore[index] = updated;
        return { ...updated };
      }),
    onSuccess: (connection) => {
      queryClient.invalidateQueries({ queryKey: brokerKeys.all });
      queryClient.setQueryData(brokerKeys.detail(connection.connectionId), connection);
    },
  });
}

export interface TestBrokerInput {
  connectionId: string;
}

export function useTestBroker(): UseMutationResult<
  BrokerConnectionTestResult,
  Error,
  TestBrokerInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ connectionId }: TestBrokerInput) =>
      simulateFetch<BrokerConnectionTestResult>(() => {
        const connection = findConnection(connectionId);
        const timestamp = nowIso();
        if (connection.status === "connected") {
          return { ...MOCK_BROKER_CONNECTION_TEST_OK, checkedAt: timestamp };
        }
        return { ...MOCK_BROKER_CONNECTION_TEST_FAIL, checkedAt: timestamp };
      }),
    onSuccess: (_, { connectionId }) => {
      queryClient.invalidateQueries({ queryKey: brokerKeys.test(connectionId) });
    },
  });
}
