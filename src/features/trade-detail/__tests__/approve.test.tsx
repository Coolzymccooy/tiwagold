/* eslint-disable import/first -- jest.mock blocks must precede SUT import. */

// The live per-user approve (signs P-256 intent + POSTs /trades/:id/approve).
const mockApprove = jest.fn().mockResolvedValue({ id: "trade_1", approvalStatus: "approved" });
jest.mock("@/services/pendingTrades", () => ({
  __esModule: true,
  useApproveTrade: () => ({ mutateAsync: mockApprove, isPending: false }),
}));

// The legacy placeholder intent — must NOT be used by approve (it hard-throws
// backend_unavailable → "Broker confirmation offline" in production builds).
const mockRequestIntent = jest.fn();
jest.mock("@/services/signedIntent", () => {
  class SignedIntentError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.name = "SignedIntentError";
    }
  }
  return {
    __esModule: true,
    SignedIntentError,
    useRequestSignedIntent: () => ({ mutateAsync: mockRequestIntent, isPending: false }),
  };
});

jest.mock("@/services/trades", () => ({
  __esModule: true,
  useTrade: () => ({ data: undefined, isLoading: false, isError: false, error: null, refetch: jest.fn() }),
  useExecuteTrade: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useUpdateTradeStatus: () => ({ mutate: jest.fn(), isPending: false }),
}));

import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useTradeDetail } from "@/features/trade-detail/hooks";

describe("useTradeDetail.approve — live per-user path (regression)", () => {
  beforeEach(() => {
    mockApprove.mockClear();
    mockRequestIntent.mockClear();
  });

  it("approves via the per-user mutation with the trade id", async () => {
    const { result } = renderHook(() => useTradeDetail("trade_1"));
    act(() => {
      result.current.approve();
    });
    await waitFor(() => expect(mockApprove).toHaveBeenCalledWith({ tradeId: "trade_1" }));
    expect(result.current.actionError).toBeNull();
  });

  it("does NOT call the placeholder requestSignedIntent on approve", async () => {
    const { result } = renderHook(() => useTradeDetail("trade_1"));
    act(() => {
      result.current.approve();
    });
    await waitFor(() => expect(mockApprove).toHaveBeenCalled());
    expect(mockRequestIntent).not.toHaveBeenCalled();
  });

  it("surfaces a backend failure as actionError instead of swallowing it", async () => {
    mockApprove.mockRejectedValueOnce(new Error("approve failed"));
    const { result } = renderHook(() => useTradeDetail("trade_1"));
    act(() => {
      result.current.approve();
    });
    await waitFor(() => expect(result.current.actionError).not.toBeNull());
  });
});
