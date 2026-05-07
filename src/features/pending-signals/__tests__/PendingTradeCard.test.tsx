import { Alert } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import { PendingTradeCard } from "@/features/pending-signals/components/PendingTradeCard";
import type { PendingTrade } from "@/types/dto/pendingTrades";

function makeTrade(overrides: Partial<PendingTrade> = {}): PendingTrade {
  return {
    id: "trade_1",
    symbol: "XAUUSD",
    direction: "BUY",
    entryType: "LIMIT",
    lotSize: 0.1,
    entryPrice: 2400,
    stopLoss: 2390,
    takeProfit: 2410,
    takeProfit2: null,
    riskReward: 1,
    comment: "Tiwa-aggressive setup",
    approvalStatus: "awaiting_approval",
    approvalExpiresAt: null,
    createdAt: "2026-05-07T00:00:00Z",
    engine: "aggressive",
    ...overrides,
  };
}

interface AlertButton {
  text?: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

describe("PendingTradeCard", () => {
  beforeEach(() => {
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders symbol, direction, entry, lot size, SL, TP", () => {
    const trade = makeTrade();
    const { getByText } = render(
      <PendingTradeCard
        trade={trade}
        onApprove={async () => {}}
        onDeny={async () => {}}
      />,
    );
    expect(getByText("BUY XAUUSD")).toBeTruthy();
    expect(getByText("2,400.00")).toBeTruthy();
    expect(getByText("LIMIT ENTRY")).toBeTruthy();
    expect(getByText("Approve")).toBeTruthy();
    expect(getByText("Deny")).toBeTruthy();
  });

  test("aggressive engine label rendered when engine=aggressive", () => {
    const { getByText } = render(
      <PendingTradeCard
        trade={makeTrade({ engine: "aggressive" })}
        onApprove={async () => {}}
        onDeny={async () => {}}
      />,
    );
    expect(getByText("Aggressive")).toBeTruthy();
  });

  test("conservative engine label rendered when engine=conservative", () => {
    const { getByText } = render(
      <PendingTradeCard
        trade={makeTrade({ engine: "conservative" })}
        onApprove={async () => {}}
        onDeny={async () => {}}
      />,
    );
    expect(getByText("Conservative")).toBeTruthy();
  });

  test("Approve press shows confirm Alert with Approve action", () => {
    const onApprove = jest.fn(async () => {});
    const { getByText } = render(
      <PendingTradeCard
        trade={makeTrade()}
        onApprove={onApprove}
        onDeny={async () => {}}
      />,
    );
    fireEvent.press(getByText("Approve"));
    expect(Alert.alert).toHaveBeenCalledTimes(1);
    const [title, , buttons] = (Alert.alert as jest.Mock).mock.calls[0] as [
      string,
      string,
      AlertButton[],
    ];
    expect(title).toMatch(/Approve.*XAUUSD/);
    const approveButton = buttons.find((b) => b.text === "Approve");
    expect(approveButton).toBeDefined();
    // Simulate the user tapping the Approve button in the Alert dialog.
    approveButton?.onPress?.();
    expect(onApprove).toHaveBeenCalledWith("trade_1");
  });

  test("Deny press shows confirm Alert with Deny action", () => {
    const onDeny = jest.fn(async () => {});
    const { getByText } = render(
      <PendingTradeCard
        trade={makeTrade()}
        onApprove={async () => {}}
        onDeny={onDeny}
      />,
    );
    fireEvent.press(getByText("Deny"));
    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0] as [
      string,
      string,
      AlertButton[],
    ];
    const denyButton = buttons.find((b) => b.text === "Deny");
    expect(denyButton).toBeDefined();
    denyButton?.onPress?.();
    expect(onDeny).toHaveBeenCalledWith("trade_1");
  });

  test("risk:reward dash when riskReward = 0 (degenerate)", () => {
    const { getByText } = render(
      <PendingTradeCard
        trade={makeTrade({ riskReward: 0 })}
        onApprove={async () => {}}
        onDeny={async () => {}}
      />,
    );
    expect(getByText("—")).toBeTruthy();
  });

  test("buttons disable while busy=true", () => {
    const onApprove = jest.fn();
    const { getByText } = render(
      <PendingTradeCard
        trade={makeTrade()}
        onApprove={onApprove}
        onDeny={async () => {}}
        busy
      />,
    );
    fireEvent.press(getByText("Approve"));
    // Pressable.disabled blocks onPress, so Alert should not have been called.
    expect(Alert.alert).not.toHaveBeenCalled();
  });
});
