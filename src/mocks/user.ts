import type { UserProfile } from "@/types/user";

export const MOCK_USER: UserProfile = {
  id: "usr_demo",
  email: "demo@tiwagold.app",
  displayName: "Ade",
  tier: "founder",
  createdAt: "2026-01-04T08:12:00.000Z",
  onboardingCompletedAt: "2026-01-04T08:22:14.000Z",
  broker: {
    connectionId: "brk_paper_demo",
    kind: "paper",
    accountLabel: "Paper · Live-sim",
    status: "connected",
    connected: true,
    lastSyncedAt: "2026-04-14T00:55:00.000Z",
    balance: 25_000,
    equity: 25_420,
    currency: "USD",
  },
  notifications: {
    signalAlerts: true,
    riskBlocks: true,
    dailyRecap: true,
    macroRadar: false,
  },
  riskProfile: "balanced",
};
