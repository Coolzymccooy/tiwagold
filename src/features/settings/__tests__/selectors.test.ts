import type { BrokerConnection } from "@/types/broker";
import type { UserProfile } from "@/types/user";

import {
  toBrokerRow,
  toLegalRows,
  toNotificationRows,
  toProfileRow,
  toRiskRows,
  toSettingsView,
} from "../selectors";

function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  const base: UserProfile = {
    id: "usr_base",
    email: "trader@tiwagold.app",
    displayName: "Ada Lovelace",
    tier: "pro",
    createdAt: "2025-11-20T00:00:00.000Z",
    notifications: {
      signalAlerts: true,
      riskBlocks: true,
      dailyRecap: false,
      macroRadar: false,
    },
    riskProfile: "balanced",
  };
  return { ...base, ...overrides };
}

function makeBroker(
  overrides: Partial<BrokerConnection> = {},
): BrokerConnection {
  const base: BrokerConnection = {
    connectionId: "brk_base",
    kind: "mt5",
    accountLabel: "MT5 · 123456",
    status: "connected",
    connected: true,
    lastSyncedAt: "2026-04-14T09:59:00.000Z",
    balance: 12500,
    equity: 12487.5,
    currency: "USD",
  };
  return { ...base, ...overrides };
}

describe("settings selectors — toProfileRow", () => {
  it("maps displayName and email verbatim", () => {
    const row = toProfileRow(makeUser({ displayName: "Kai", email: "k@x.io" }));
    expect(row.displayName).toBe("Kai");
    expect(row.email).toBe("k@x.io");
  });

  it("maps each tier to its label", () => {
    expect(toProfileRow(makeUser({ tier: "founder" })).tierLabel).toBe(
      "Founder Tier",
    );
    expect(toProfileRow(makeUser({ tier: "pro" })).tierLabel).toBe("Pro Tier");
    expect(toProfileRow(makeUser({ tier: "trial" })).tierLabel).toBe(
      "Trial Tier",
    );
  });

  it("returns '—' for memberSinceLabel on invalid createdAt", () => {
    const row = toProfileRow(makeUser({ createdAt: "not-a-date" }));
    expect(row.memberSinceLabel).toBe("—");
  });

  it("returns a non-empty label for a valid createdAt", () => {
    const row = toProfileRow(
      makeUser({ createdAt: "2025-11-20T00:00:00.000Z" }),
    );
    expect(row.memberSinceLabel).not.toBe("—");
    expect(row.memberSinceLabel.length).toBeGreaterThan(0);
  });

  it("flags the profile as demo with a Phase 3 note when no live MT5 account is supplied", () => {
    const row = toProfileRow(makeUser());
    expect(row.isDemo).toBe(true);
    expect(row.demoNote).toContain("Phase 3");
  });

  it("overlays the live MT5 account number + broker into the profile row", () => {
    const row = toProfileRow(makeUser(), {
      number: "52812281",
      broker: "Raw Trading Ltd",
      server: "ICMarketsSC-Demo",
      balance: 100,
      equity: 100,
      openPositions: 0,
      connectedToBroker: true,
    });
    expect(row.displayName).toBe("Account 52812281");
    expect(row.email).toBe("Raw Trading Ltd · ICMarketsSC-Demo");
    expect(row.tierLabel).toBe("Demo profile");
    expect(row.memberSinceLabel).toBe("Phase 3 auth pending");
    expect(row.isDemo).toBe(true);
    expect(row.demoNote).toMatch(/Phase 3/);
  });
});

describe("settings selectors — toBrokerRow", () => {
  it("returns disconnected shape when broker is undefined", () => {
    const row = toBrokerRow(undefined);
    expect(row).toEqual({
      connected: false,
      statusLabel: "Not connected",
      accountLabel: null,
      kindLabel: null,
      balanceLabel: null,
      equityLabel: null,
      lastSyncedLabel: null,
      broker: null,
    });
  });

  it("returns disconnected shape but preserves broker ref when connected=false", () => {
    const broker = makeBroker({ connected: false, status: "disconnected" });
    const row = toBrokerRow(broker);
    expect(row.connected).toBe(false);
    expect(row.statusLabel).toBe("Not connected");
    expect(row.broker).toBe(broker);
    expect(row.accountLabel).toBeNull();
    expect(row.balanceLabel).toBeNull();
  });

  it("maps connected broker with formatted balance and equity", () => {
    const broker = makeBroker({
      kind: "oanda",
      accountLabel: "OANDA · live-42",
      balance: 10_000,
      equity: 10_123.456,
      currency: "USD",
    });
    const row = toBrokerRow(broker);
    expect(row.connected).toBe(true);
    expect(row.statusLabel).toBe("Connected");
    expect(row.accountLabel).toBe("OANDA · live-42");
    expect(row.kindLabel).toBe("OANDA");
    expect(row.balanceLabel).toBe("USD 10,000.00");
    expect(row.equityLabel).toBe("USD 10,123.46");
  });

  it("maps each broker kind to its label", () => {
    expect(toBrokerRow(makeBroker({ kind: "mt5" })).kindLabel).toBe(
      "MetaTrader 5",
    );
    expect(toBrokerRow(makeBroker({ kind: "oanda" })).kindLabel).toBe("OANDA");
    expect(toBrokerRow(makeBroker({ kind: "ctrader" })).kindLabel).toBe(
      "cTrader",
    );
    expect(toBrokerRow(makeBroker({ kind: "paper" })).kindLabel).toBe(
      "Paper trading",
    );
  });

  it("defaults currency to USD when broker.currency is missing", () => {
    const row = toBrokerRow(
      makeBroker({ balance: 1500, equity: 1500, currency: undefined }),
    );
    expect(row.balanceLabel).toBe("USD 1,500.00");
  });

  it("returns null balance/equity labels when values are undefined", () => {
    const row = toBrokerRow(
      makeBroker({ balance: undefined, equity: undefined }),
    );
    expect(row.balanceLabel).toBeNull();
    expect(row.equityLabel).toBeNull();
  });

  describe("lastSyncedLabel", () => {
    const NOW = new Date("2026-04-14T10:00:00.000Z").valueOf();

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(NOW));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("returns null when lastSyncedAt is undefined", () => {
      const row = toBrokerRow(makeBroker({ lastSyncedAt: undefined }));
      expect(row.lastSyncedLabel).toBeNull();
    });

    it("returns null for an invalid timestamp", () => {
      const row = toBrokerRow(makeBroker({ lastSyncedAt: "not-a-date" }));
      expect(row.lastSyncedLabel).toBeNull();
    });

    it("returns 'just now' when diff is under 1 minute", () => {
      const row = toBrokerRow(
        makeBroker({ lastSyncedAt: new Date(NOW - 10_000).toISOString() }),
      );
      expect(row.lastSyncedLabel).toBe("just now");
    });

    it("returns 'Nm ago' when diff is between 1 and 59 minutes", () => {
      const row = toBrokerRow(
        makeBroker({ lastSyncedAt: new Date(NOW - 7 * 60_000).toISOString() }),
      );
      expect(row.lastSyncedLabel).toBe("7m ago");
    });

    it("returns 'Nh ago' when diff is between 1 and 23 hours", () => {
      const row = toBrokerRow(
        makeBroker({
          lastSyncedAt: new Date(NOW - 3 * 60 * 60_000).toISOString(),
        }),
      );
      expect(row.lastSyncedLabel).toBe("3h ago");
    });

    it("returns 'Nd ago' when diff is at least 24 hours", () => {
      const row = toBrokerRow(
        makeBroker({
          lastSyncedAt: new Date(NOW - 2 * 24 * 60 * 60_000).toISOString(),
        }),
      );
      expect(row.lastSyncedLabel).toBe("2d ago");
    });
  });
});

describe("settings selectors — toNotificationRows", () => {
  it("emits one row per notification preference key in a stable order", () => {
    const rows = toNotificationRows({
      signalAlerts: true,
      riskBlocks: false,
      dailyRecap: true,
      macroRadar: false,
    });
    expect(rows.map((r) => r.id)).toEqual([
      "signalAlerts",
      "riskBlocks",
      "dailyRecap",
      "macroRadar",
    ]);
  });

  it("reflects the enabled flag from preferences", () => {
    const rows = toNotificationRows({
      signalAlerts: true,
      riskBlocks: false,
      dailyRecap: true,
      macroRadar: false,
    });
    const byId = Object.fromEntries(rows.map((r) => [r.id, r.enabled]));
    expect(byId.signalAlerts).toBe(true);
    expect(byId.riskBlocks).toBe(false);
    expect(byId.dailyRecap).toBe(true);
    expect(byId.macroRadar).toBe(false);
  });

  it("attaches human-readable labels to each row", () => {
    const rows = toNotificationRows({
      signalAlerts: true,
      riskBlocks: true,
      dailyRecap: true,
      macroRadar: true,
    });
    for (const row of rows) {
      expect(row.label.length).toBeGreaterThan(0);
    }
  });
});

describe("settings selectors — toRiskRows", () => {
  it("returns the full catalog of risk options in order", () => {
    const rows = toRiskRows("balanced");
    expect(rows.map((r) => r.id)).toEqual([
      "cautious",
      "balanced",
      "aggressive",
    ]);
  });

  it("marks only the selected option", () => {
    const rows = toRiskRows("aggressive");
    const selected = rows.filter((r) => r.selected).map((r) => r.id);
    expect(selected).toEqual(["aggressive"]);
  });

  it("attaches label and hint to each option", () => {
    const rows = toRiskRows("cautious");
    const cautious = rows.find((r) => r.id === "cautious");
    expect(cautious?.label).toBe("Cautious");
    expect(cautious?.hint).toBe("0.25–0.5% per trade");
  });
});

describe("settings selectors — toLegalRows", () => {
  it("returns the three legal entries in order", () => {
    const rows = toLegalRows();
    expect(rows.map((r) => r.id)).toEqual(["terms", "privacy", "disclaimer"]);
  });

  it("returns a fresh array each call (caller-safe)", () => {
    const a = toLegalRows();
    const b = toLegalRows();
    expect(a).not.toBe(b);
    expect(a[0]).not.toBe(b[0]);
  });
});

describe("settings selectors — toSettingsView", () => {
  it("returns undefined when user is undefined", () => {
    expect(toSettingsView(undefined)).toBeUndefined();
  });

  it("composes profile, broker, notifications, risk, and legal sections", () => {
    const view = toSettingsView(
      makeUser({ tier: "founder", broker: makeBroker() }),
    );
    expect(view?.profile.tierLabel).toBe("Founder Tier");
    expect(view?.broker.connected).toBe(true);
    expect(view?.notifications.length).toBe(4);
    expect(view?.risk.length).toBe(3);
    expect(view?.legal.length).toBe(3);
  });

  it("surfaces disconnected broker row when user has no broker", () => {
    const view = toSettingsView(makeUser({ broker: undefined }));
    expect(view?.broker.connected).toBe(false);
    expect(view?.broker.broker).toBeNull();
  });
});
