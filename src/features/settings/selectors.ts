import { COPY } from "@/content/copy";
import type { BrokerConnection, BrokerKind } from "@/types/broker";
import type { NotificationPreferences, UserProfile } from "@/types/user";
import type {
  NotificationToggleId,
  RiskProfileId,
  SettingsBrokerRow,
  SettingsLegalRow,
  SettingsNotificationRow,
  SettingsProfileRow,
  SettingsRiskRow,
  SettingsView,
} from "./types";

const TIER_LABELS: Record<UserProfile["tier"], string> = {
  founder: "Founder Tier",
  pro: "Pro Tier",
  trial: "Trial Tier",
};

const BROKER_KIND_LABELS: Record<BrokerKind, string> = {
  mt5: "MetaTrader 5",
  oanda: "OANDA",
  ctrader: "cTrader",
  paper: "Paper trading",
};

const RISK_OPTIONS: readonly {
  id: RiskProfileId;
  label: string;
  hint: string;
}[] = [
  { id: "cautious", label: "Cautious", hint: "0.25–0.5% per trade" },
  { id: "balanced", label: "Balanced", hint: "0.5–1.0% per trade" },
  { id: "aggressive", label: "Aggressive", hint: "1.0–2.0% per trade" },
];

const NOTIFICATION_LABELS: Record<NotificationToggleId, string> = {
  signalAlerts: COPY.settings.notifications.signalAlerts,
  riskBlocks: COPY.settings.notifications.riskBlocks,
  dailyRecap: COPY.settings.notifications.dailyRecap,
  macroRadar: COPY.settings.notifications.macroRadar,
};

const LEGAL_ROWS: readonly SettingsLegalRow[] = [
  { id: "terms", label: COPY.settings.legal.terms },
  { id: "privacy", label: COPY.settings.legal.privacy },
  { id: "disclaimer", label: COPY.settings.legal.disclaimer },
];

export function toProfileRow(user: UserProfile): SettingsProfileRow {
  return {
    displayName: user.displayName,
    email: user.email,
    tierLabel: TIER_LABELS[user.tier],
    memberSinceLabel: formatMemberSince(user.createdAt),
  };
}

export function toBrokerRow(
  broker: BrokerConnection | undefined,
): SettingsBrokerRow {
  if (!broker || !broker.connected) {
    return {
      connected: false,
      statusLabel: COPY.settings.broker.disconnected,
      accountLabel: null,
      kindLabel: null,
      balanceLabel: null,
      equityLabel: null,
      lastSyncedLabel: null,
      broker: broker ?? null,
    };
  }

  return {
    connected: true,
    statusLabel: COPY.settings.broker.connected,
    accountLabel: broker.accountLabel,
    kindLabel: BROKER_KIND_LABELS[broker.kind],
    balanceLabel: formatCurrency(broker.balance, broker.currency),
    equityLabel: formatCurrency(broker.equity, broker.currency),
    lastSyncedLabel: formatLastSynced(broker.lastSyncedAt),
    broker,
  };
}

export function toNotificationRows(
  preferences: NotificationPreferences,
): SettingsNotificationRow[] {
  return (Object.keys(NOTIFICATION_LABELS) as NotificationToggleId[]).map(
    (id) => ({
      id,
      label: NOTIFICATION_LABELS[id],
      enabled: preferences[id],
    }),
  );
}

export function toRiskRows(selected: RiskProfileId): SettingsRiskRow[] {
  return RISK_OPTIONS.map((option) => ({
    id: option.id,
    label: option.label,
    hint: option.hint,
    selected: option.id === selected,
  }));
}

export function toLegalRows(): SettingsLegalRow[] {
  return LEGAL_ROWS.map((row) => ({ ...row }));
}

export function toSettingsView(
  user: UserProfile | undefined,
): SettingsView | undefined {
  if (!user) return undefined;
  return {
    profile: toProfileRow(user),
    broker: toBrokerRow(user.broker),
    notifications: toNotificationRows(user.notifications),
    risk: toRiskRows(user.riskProfile),
    legal: toLegalRows(),
  };
}

function formatMemberSince(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(
  value: number | undefined,
  currency: string | undefined,
): string | null {
  if (value === undefined || Number.isNaN(value)) return null;
  const code = currency ?? "USD";
  const rounded = Math.round(value * 100) / 100;
  return `${code} ${rounded.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatLastSynced(iso: string | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return null;
  const diffMs = Date.now() - date.valueOf();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}
