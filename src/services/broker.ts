import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { z } from "zod";
import {
  MOCK_BROKER_CONNECTIONS,
  MOCK_BROKER_CONNECTION_TEST_FAIL,
  MOCK_BROKER_CONNECTION_TEST_OK,
} from "@/mocks/broker";
import { useAuthStore, selectAccessToken } from "@/state/authStore";
import type {
  BrokerConnection,
  BrokerConnectionInput,
  BrokerConnectionPatch,
  BrokerConnectionTestResult,
  BrokerKind,
} from "@/types/broker";
import { authFetch, isLiveBackendEnabled } from "./liveBackend";
import { createId, nowIso, simulateFetch } from "./client";
import { assertSignedIntentInProduction } from "./signedIntent";

export const brokerKeys = {
  all: ["broker", "connections"] as const,
  detail: (id: string) => ["broker", "connection", id] as const,
  test: (id: string) => ["broker", "connection", id, "test"] as const,
};

const livePublicConnectionSchema = z.object({
  id: z.string(),
  kind: z.enum(["mt5", "oanda", "ctrader", "paper"]),
  accountLabel: z.string(),
  environment: z.enum(["demo", "live"]),
  status: z.enum(["connected", "disconnected", "degraded"]),
  lastErrorCode: z.string().nullable(),
  lastErrorMessage: z.string().nullable(),
  lastSyncedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const liveListSchema = z.object({
  connections: z.array(livePublicConnectionSchema),
});

const liveSingleSchema = z.object({ connection: livePublicConnectionSchema });

const liveTestSchema = z.object({
  ok: z.boolean(),
  lastSyncedAt: z.string().nullable().optional(),
  connection: livePublicConnectionSchema.nullable().optional(),
});

type LivePublicConnection = z.infer<typeof livePublicConnectionSchema>;

function liveToBrokerConnection(c: LivePublicConnection): BrokerConnection {
  return {
    connectionId: c.id,
    kind: c.kind,
    accountLabel: c.accountLabel,
    status: c.status,
    connected: c.status === "connected",
    lastSyncedAt: c.lastSyncedAt ?? undefined,
    lastErrorCode: c.lastErrorCode ?? undefined,
    lastErrorMessage: c.lastErrorMessage ?? undefined,
  };
}

function buildCredentialsPayload(input: BrokerConnectionInput): Record<string, unknown> {
  const kind: BrokerKind = input.kind;
  if (kind === "mt5") {
    return {
      kind,
      accountNumber: input.login ?? "",
      password: input.password ?? "",
      server: input.server ?? "",
    };
  }
  if (kind === "oanda") {
    return {
      kind,
      accountId: input.login ?? "",
      apiToken: input.apiKey ?? "",
    };
  }
  if (kind === "ctrader") {
    return {
      kind,
      clientId: input.apiKey ?? "",
      clientSecret: input.apiSecret ?? "",
      accessToken: input.password ?? "",
    };
  }
  return { kind: "paper", startingBalance: 10_000 };
}

function shouldUseLive(token: string | null): boolean {
  return isLiveBackendEnabled() && Boolean(token && token.length > 0);
}

const brokerStore: BrokerConnection[] = MOCK_BROKER_CONNECTIONS.map((c) => ({ ...c }));

function findMockConnection(id: string): BrokerConnection {
  const match = brokerStore.find((c) => c.connectionId === id);
  if (!match) throw new Error("Broker connection not found");
  return match;
}

export function useBrokerConnections(): UseQueryResult<BrokerConnection[], Error> {
  const accessToken = useAuthStore(selectAccessToken)?.value ?? null;
  return useQuery({
    queryKey: brokerKeys.all,
    queryFn: async () => {
      if (shouldUseLive(accessToken)) {
        const raw = await authFetch<unknown>("/broker/connections", {
          bearerToken: accessToken,
        });
        return liveListSchema.parse(raw).connections.map(liveToBrokerConnection);
      }
      return simulateFetch(() => brokerStore.map((c) => ({ ...c })));
    },
    staleTime: 30_000,
  });
}

export function useBrokerConnection(
  id: string | undefined,
): UseQueryResult<BrokerConnection, Error> {
  const accessToken = useAuthStore(selectAccessToken)?.value ?? null;
  return useQuery({
    queryKey: id ? brokerKeys.detail(id) : ["broker", "connection", "pending"],
    queryFn: async () => {
      if (!id) throw new Error("Missing connection id");
      if (shouldUseLive(accessToken)) {
        const raw = await authFetch<unknown>(`/broker/connections/${id}`, {
          bearerToken: accessToken,
        });
        return liveToBrokerConnection(liveSingleSchema.parse(raw).connection);
      }
      return simulateFetch<BrokerConnection>(() => ({ ...findMockConnection(id) }));
    },
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
  const accessToken = useAuthStore(selectAccessToken)?.value ?? null;
  return useMutation({
    mutationFn: async (input: BrokerConnectionInput) => {
      if (shouldUseLive(accessToken)) {
        const raw = await authFetch<unknown>("/broker/connections", {
          method: "POST",
          bearerToken: accessToken,
          body: {
            accountLabel: input.accountLabel,
            environment: input.environment ?? "demo",
            credentials: buildCredentialsPayload(input),
          },
        });
        return liveToBrokerConnection(liveSingleSchema.parse(raw).connection);
      }
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
  const accessToken = useAuthStore(selectAccessToken)?.value ?? null;
  return useMutation({
    mutationFn: async ({ connectionId }: DisconnectBrokerInput) => {
      if (shouldUseLive(accessToken)) {
        await authFetch<unknown>(`/broker/connections/${connectionId}`, {
          method: "DELETE",
          bearerToken: accessToken,
        });
        return;
      }
      return simulateFetch<void>(() => {
        const index = brokerStore.findIndex((c) => c.connectionId === connectionId);
        if (index === -1) throw new Error("Broker connection not found");
        brokerStore.splice(index, 1);
      });
    },
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
        const existing = findMockConnection(connectionId);
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
  const accessToken = useAuthStore(selectAccessToken)?.value ?? null;
  return useMutation({
    mutationFn: async ({ connectionId }: TestBrokerInput) => {
      if (shouldUseLive(accessToken)) {
        const startedAt = Date.now();
        const raw = await authFetch<unknown>(`/broker/connections/${connectionId}/test`, {
          method: "POST",
          bearerToken: accessToken,
        });
        const parsed = liveTestSchema.parse(raw);
        return {
          ok: parsed.ok,
          checkedAt: parsed.lastSyncedAt ?? new Date().toISOString(),
          latencyMs: Date.now() - startedAt,
        } satisfies BrokerConnectionTestResult;
      }
      return simulateFetch<BrokerConnectionTestResult>(() => {
        const connection = findMockConnection(connectionId);
        const timestamp = nowIso();
        if (connection.status === "connected") {
          return { ...MOCK_BROKER_CONNECTION_TEST_OK, checkedAt: timestamp };
        }
        return { ...MOCK_BROKER_CONNECTION_TEST_FAIL, checkedAt: timestamp };
      });
    },
    onSuccess: (_, { connectionId }) => {
      queryClient.invalidateQueries({ queryKey: brokerKeys.test(connectionId) });
    },
  });
}
