/* eslint-disable import/first -- jest.mock blocks must precede SUT imports so the mocked bindings are in place when the SUT is loaded. */
// Mock the live-backend + signing surface so the hook tests stay pure.
const mockAuthFetch = jest.fn();
const mockIsLiveBackendEnabled = jest.fn();
jest.mock("@/services/liveBackend", () => ({
  __esModule: true,
  authFetch: (...args: unknown[]) => mockAuthFetch(...args),
  isLiveBackendEnabled: () => mockIsLiveBackendEnabled(),
}));

const mockSignApproval = jest.fn();
const mockSignDeny = jest.fn();
jest.mock("@/services/liveSignedIntent", () => ({
  __esModule: true,
  signApprovalIntent: (...args: unknown[]) => mockSignApproval(...args),
  signDenyIntent: (...args: unknown[]) => mockSignDeny(...args),
}));

import { renderHook, waitFor, act } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { type ReactNode } from "react";

import {
  usePendingTrades,
  useApproveTrade,
  useDenyTrade,
} from "@/services/pendingTrades";
import { useAuthStore } from "@/state/authStore";

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

function wrapper(client: QueryClient) {
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

function setSignedIn(): void {
  useAuthStore.setState({
    session: {
      userId: "u1",
      access: {
        value: "ACCESS-TOKEN",
        tokenType: "Bearer",
        issuedAt: "2026-01-01T00:00:00Z",
        expiresAt: "2026-01-01T00:30:00Z",
      },
    },
    user: null,
    onboardingComplete: true,
    hydrated: true,
  });
}

function setSignedOut(): void {
  useAuthStore.setState({
    session: null,
    user: null,
    onboardingComplete: false,
    hydrated: true,
  });
}

beforeEach(() => {
  mockAuthFetch.mockReset();
  mockIsLiveBackendEnabled.mockReset();
  mockSignApproval.mockReset();
  mockSignDeny.mockReset();
  setSignedOut();
});

describe("usePendingTrades", () => {
  test("returns [] when live backend is disabled (mock fallback)", async () => {
    mockIsLiveBackendEnabled.mockReturnValue(false);
    const client = makeQueryClient();
    const { result } = renderHook(() => usePendingTrades(), {
      wrapper: wrapper(client),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
    expect(mockAuthFetch).not.toHaveBeenCalled();
  });

  test("fetches /trades/pending and normalizes when live", async () => {
    mockIsLiveBackendEnabled.mockReturnValue(true);
    setSignedIn();
    mockAuthFetch.mockResolvedValueOnce({
      items: [
        {
          id: "p1",
          symbol: "XAUUSD",
          direction: "BUY",
          entry_price: 2400,
          stop_loss: 2390,
          take_profit: 2410,
          comment: "Tiwa-aggressive",
        },
      ],
    });

    const client = makeQueryClient();
    const { result } = renderHook(() => usePendingTrades(), {
      wrapper: wrapper(client),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockAuthFetch).toHaveBeenCalledWith("/trades/pending", {
      bearerToken: "ACCESS-TOKEN",
    });
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]).toMatchObject({
      id: "p1",
      direction: "BUY",
      engine: "aggressive",
      riskReward: 1,
    });
  });

  test("throws when live backend is enabled but no access token", async () => {
    mockIsLiveBackendEnabled.mockReturnValue(true);
    setSignedOut();
    const client = makeQueryClient();
    const { result } = renderHook(() => usePendingTrades(), {
      wrapper: wrapper(client),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toMatch(/Not signed in/);
  });
});

describe("useApproveTrade / useDenyTrade", () => {
  test("approve: mock backend short-circuits to optimistic success without signing", async () => {
    mockIsLiveBackendEnabled.mockReturnValue(false);
    const client = makeQueryClient();
    const { result } = renderHook(() => useApproveTrade(), {
      wrapper: wrapper(client),
    });

    let response: { id: string; approvalStatus: string } | undefined;
    await act(async () => {
      response = await result.current.mutateAsync({ tradeId: "rA" });
    });
    expect(response).toEqual({ id: "rA", approvalStatus: "approved" });
    expect(mockSignApproval).not.toHaveBeenCalled();
    expect(mockAuthFetch).not.toHaveBeenCalled();
  });

  test("approve: live path signs intent + POSTs with X-Intent header", async () => {
    mockIsLiveBackendEnabled.mockReturnValue(true);
    setSignedIn();
    mockSignApproval.mockResolvedValueOnce("INTENT.JWT.SIG");
    mockAuthFetch.mockResolvedValueOnce({ id: "rA", approvalStatus: "approved" });

    const client = makeQueryClient();
    const { result } = renderHook(() => useApproveTrade(), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync({ tradeId: "rA" });
    });

    expect(mockSignApproval).toHaveBeenCalledWith({
      bearerToken: "ACCESS-TOKEN",
      tradeId: "rA",
    });
    expect(mockAuthFetch).toHaveBeenCalledWith(
      "/trades/rA/approve",
      expect.objectContaining({
        method: "POST",
        bearerToken: "ACCESS-TOKEN",
        extraHeaders: { "x-intent": "INTENT.JWT.SIG" },
      }),
    );
  });

  test("approve: throws when live backend is enabled but no access token", async () => {
    mockIsLiveBackendEnabled.mockReturnValue(true);
    setSignedOut();
    const client = makeQueryClient();
    const { result } = renderHook(() => useApproveTrade(), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ tradeId: "rA" }),
      ).rejects.toThrow(/Not signed in/);
    });
    expect(mockSignApproval).not.toHaveBeenCalled();
  });

  test("deny: live path uses /deny endpoint and signDenyIntent", async () => {
    mockIsLiveBackendEnabled.mockReturnValue(true);
    setSignedIn();
    mockSignDeny.mockResolvedValueOnce("DENY.JWT");
    mockAuthFetch.mockResolvedValueOnce({ id: "rB", approvalStatus: "denied" });

    const client = makeQueryClient();
    const { result } = renderHook(() => useDenyTrade(), {
      wrapper: wrapper(client),
    });
    await act(async () => {
      await result.current.mutateAsync({ tradeId: "rB" });
    });

    expect(mockSignDeny).toHaveBeenCalledWith({
      bearerToken: "ACCESS-TOKEN",
      tradeId: "rB",
    });
    expect(mockAuthFetch).toHaveBeenCalledWith(
      "/trades/rB/deny",
      expect.objectContaining({
        method: "POST",
        extraHeaders: { "x-intent": "DENY.JWT" },
      }),
    );
  });

  test("approve: encodes path-unsafe trade IDs", async () => {
    mockIsLiveBackendEnabled.mockReturnValue(true);
    setSignedIn();
    mockSignApproval.mockResolvedValueOnce("X");
    mockAuthFetch.mockResolvedValueOnce({ id: "weird id/with slash", approvalStatus: "approved" });

    const client = makeQueryClient();
    const { result } = renderHook(() => useApproveTrade(), {
      wrapper: wrapper(client),
    });
    await act(async () => {
      await result.current.mutateAsync({ tradeId: "weird id/with slash" });
    });
    const path = (mockAuthFetch.mock.calls[0] as [string, unknown])[0];
    expect(path).toBe(`/trades/${encodeURIComponent("weird id/with slash")}/approve`);
  });
});
