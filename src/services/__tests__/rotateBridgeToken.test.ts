/* eslint-disable import/first -- jest.mock blocks must precede SUT imports so the mocked bindings are in place when the SUT is loaded. */
const mockAuthFetch = jest.fn();
const mockIsLiveBackendEnabled = jest.fn();
jest.mock("@/services/liveBackend", () => ({
  __esModule: true,
  authFetch: (...args: unknown[]) => mockAuthFetch(...args),
  isLiveBackendEnabled: () => mockIsLiveBackendEnabled(),
}));

import { renderHook, act, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { type ReactNode } from "react";

import { useRotateBridgeToken } from "@/services/broker";
import { useAuthStore } from "@/state/authStore";

function makeClient(): QueryClient {
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
  setSignedOut();
});

describe("useRotateBridgeToken", () => {
  test("mock backend returns a 64-hex placeholder without hitting the cloud", async () => {
    mockIsLiveBackendEnabled.mockReturnValue(false);
    const client = makeClient();
    const { result } = renderHook(() => useRotateBridgeToken(), {
      wrapper: wrapper(client),
    });
    let payload: { token: string } | undefined;
    await act(async () => {
      payload = await result.current.mutateAsync();
    });
    expect(payload?.token).toMatch(/^[0-9a-f]{64}$/);
    expect(mockAuthFetch).not.toHaveBeenCalled();
  });

  test("live path POSTs to /me/bridge-token/rotate and returns the new token", async () => {
    mockIsLiveBackendEnabled.mockReturnValue(true);
    setSignedIn();
    const newToken = "a".repeat(64);
    mockAuthFetch.mockResolvedValueOnce({ token: newToken });

    const client = makeClient();
    const { result } = renderHook(() => useRotateBridgeToken(), {
      wrapper: wrapper(client),
    });
    let payload: { token: string } | undefined;
    await act(async () => {
      payload = await result.current.mutateAsync();
    });
    expect(payload?.token).toBe(newToken);
    expect(mockAuthFetch).toHaveBeenCalledWith("/me/bridge-token/rotate", {
      method: "POST",
      bearerToken: "ACCESS-TOKEN",
    });
  });

  test("rejects malformed cloud response (zod schema fail)", async () => {
    mockIsLiveBackendEnabled.mockReturnValue(true);
    setSignedIn();
    mockAuthFetch.mockResolvedValueOnce({ token: "not-hex" });

    const client = makeClient();
    const { result } = renderHook(() => useRotateBridgeToken(), {
      wrapper: wrapper(client),
    });
    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toThrow();
    });
  });

  test("invalidates bridge-status query on success so the pill re-polls", async () => {
    mockIsLiveBackendEnabled.mockReturnValue(true);
    setSignedIn();
    mockAuthFetch.mockResolvedValueOnce({ token: "b".repeat(64) });

    const client = makeClient();
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useRotateBridgeToken(), {
      wrapper: wrapper(client),
    });
    await act(async () => {
      await result.current.mutateAsync();
    });
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["broker", "bridge-status"],
      });
    });
  });

  test("when live but signed out, falls back to the mock branch (no auth header to send)", async () => {
    mockIsLiveBackendEnabled.mockReturnValue(true);
    setSignedOut();
    const client = makeClient();
    const { result } = renderHook(() => useRotateBridgeToken(), {
      wrapper: wrapper(client),
    });
    let payload: { token: string } | undefined;
    await act(async () => {
      payload = await result.current.mutateAsync();
    });
    // Mock branch: deterministic placeholder + no fetch
    expect(payload?.token).toMatch(/^[0-9a-f]{64}$/);
    expect(mockAuthFetch).not.toHaveBeenCalled();
  });
});
