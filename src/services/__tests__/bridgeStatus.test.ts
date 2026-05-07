import {
  bridgeStatusToPill,
  type BridgeStatus,
} from "@/services/broker";

function status(partial: Partial<BridgeStatus>): BridgeStatus {
  return {
    tokenActive: false,
    lastUsedAt: null,
    containerStatus: "none",
    lastError: null,
    ...partial,
  };
}

describe("bridgeStatusToPill", () => {
  test("null input → Not connected (muted)", () => {
    expect(bridgeStatusToPill(null)).toEqual({
      label: "Not connected",
      tone: "muted",
      showError: false,
    });
  });

  test("undefined input → Not connected (muted)", () => {
    expect(bridgeStatusToPill(undefined)).toEqual({
      label: "Not connected",
      tone: "muted",
      showError: false,
    });
  });

  test('containerStatus="none" → Not connected (muted)', () => {
    expect(bridgeStatusToPill(status({ containerStatus: "none" }))).toEqual({
      label: "Not connected",
      tone: "muted",
      showError: false,
    });
  });

  test('containerStatus="pending" → Provisioning (accent)', () => {
    expect(
      bridgeStatusToPill(status({ containerStatus: "pending" })),
    ).toEqual({
      label: "Provisioning",
      tone: "accent",
      showError: false,
    });
  });

  test('containerStatus="provisioning" → Provisioning (accent)', () => {
    expect(
      bridgeStatusToPill(status({ containerStatus: "provisioning" })),
    ).toEqual({
      label: "Provisioning",
      tone: "accent",
      showError: false,
    });
  });

  test('containerStatus="active" → Active (success)', () => {
    expect(
      bridgeStatusToPill(status({ containerStatus: "active", tokenActive: true })),
    ).toEqual({
      label: "Active",
      tone: "success",
      showError: false,
    });
  });

  test('containerStatus="failed" → Failed (danger) with showError=true', () => {
    expect(
      bridgeStatusToPill(
        status({ containerStatus: "failed", lastError: "timeout" }),
      ),
    ).toEqual({
      label: "Failed",
      tone: "danger",
      showError: true,
    });
  });
});
