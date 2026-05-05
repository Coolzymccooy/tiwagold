import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Activity, AlertTriangle, CheckCircle2, RadioTower } from "lucide-react-native";
import { GlassCard, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import { useMt5Status } from "@/services/mt5Status";

function formatRelative(iso: string | null): string {
  if (!iso) return "never";
  const ms = new Date(iso).getTime();
  if (!Number.isFinite(ms)) return "never";
  const diffSec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (diffSec < 30) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

function formatMoney(value: number | null, currency: string): string {
  if (value === null) return "—";
  return `${currency} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function BridgeStatusCard() {
  const { data, isLoading, isError } = useMt5Status();
  const status = useMemo<{
    label: string;
    tone: "success" | "accent" | "danger";
    icon: React.ReactNode;
  } | null>(() => {
    if (!data) return null;
    if (data.online && data.account?.connectedToBroker) {
      return {
        label: "Bridge online",
        tone: "success",
        icon: <CheckCircle2 size={16} color={palette.status.success} />,
      };
    }
    if (data.online) {
      return {
        label: "Bridge online · broker disconnected",
        tone: "accent",
        icon: <AlertTriangle size={16} color={palette.status.warn} />,
      };
    }
    return {
      label: "Bridge offline",
      tone: "danger",
      icon: <AlertTriangle size={16} color={palette.status.danger} />,
    };
  }, [data]);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <RadioTower size={18} color={palette.accent.gold} />
        </View>
        <View style={styles.headerText}>
          <Text variant="title" weight="semibold">
            Trading Bridge
          </Text>
          <Text variant="caption" tone="muted">
            Live link between Tiwa and your MT5 terminal
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.stateRow}>
          <ActivityIndicator color={palette.accent.gold} />
          <Text variant="body" tone="muted">
            Checking bridge…
          </Text>
        </View>
      ) : isError || !data ? (
        <View style={styles.stateRow}>
          <AlertTriangle size={16} color={palette.status.danger} />
          <Text variant="body" tone="danger">
            Could not reach bridge status.
          </Text>
        </View>
      ) : (
        <View style={styles.body}>
          <View style={styles.statusPill}>
            {status?.icon}
            <Text variant="caption" weight="semibold" tone={status?.tone ?? "muted"}>
              {status?.label ?? "Unknown"}
            </Text>
          </View>

          <View style={styles.row}>
            <Text variant="caption" tone="muted">
              Last heartbeat
            </Text>
            <View style={styles.heartbeatValue}>
              <Activity size={12} color={palette.fg.muted} />
              <Text variant="body" weight="semibold">
                {formatRelative(data.lastHeartbeat)}
              </Text>
            </View>
          </View>

          {data.account ? (
            <>
              <View style={styles.row}>
                <Text variant="caption" tone="muted">
                  Account
                </Text>
                <Text variant="body" weight="semibold" family="mono">
                  {data.account.number ?? "—"}
                </Text>
              </View>
              <View style={styles.row}>
                <Text variant="caption" tone="muted">
                  Broker
                </Text>
                <Text variant="body" weight="semibold">
                  {data.account.broker ?? "—"}
                </Text>
              </View>
              <View style={styles.row}>
                <Text variant="caption" tone="muted">
                  Server
                </Text>
                <Text variant="body" weight="medium" family="mono">
                  {data.account.server ?? "—"}
                </Text>
              </View>
              <View style={styles.row}>
                <Text variant="caption" tone="muted">
                  Balance
                </Text>
                <Text variant="body" weight="semibold" family="mono">
                  {formatMoney(data.account.balance, "USD")}
                </Text>
              </View>
              <View style={styles.row}>
                <Text variant="caption" tone="muted">
                  Equity
                </Text>
                <Text
                  variant="body"
                  weight="semibold"
                  tone="accent"
                  family="mono"
                >
                  {formatMoney(data.account.equity, "USD")}
                </Text>
              </View>
              <View style={styles.row}>
                <Text variant="caption" tone="muted">
                  Open positions
                </Text>
                <Text variant="body" weight="semibold" family="mono">
                  {data.account.openPositions}
                </Text>
              </View>
            </>
          ) : (
            <Text variant="caption" tone="muted">
              No account heartbeat yet. Start your MT5 terminal and the EA to
              link your account.
            </Text>
          )}
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(233,177,76,0.10)",
    borderWidth: 1,
    borderColor: palette.accent.goldDeep,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  body: {
    gap: spacing.sm,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.hairline,
    alignSelf: "flex-start",
    backgroundColor: palette.bg.elevated,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heartbeatValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  stateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
