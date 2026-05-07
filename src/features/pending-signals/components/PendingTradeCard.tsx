import { useCallback, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { GlassCard, PressableScale, Text } from "@/design/primitives";
import { palette, spacing, radius, font } from "@/design/tokens";
import type { PendingTrade } from "@/types/dto/pendingTrades";

interface PendingTradeCardProps {
  trade: PendingTrade;
  onApprove: (tradeId: string) => Promise<void>;
  onDeny: (tradeId: string) => Promise<void>;
  /** When true, both buttons disabled while a mutation is in flight. */
  busy?: boolean;
}

function formatNumber(value: number, fractionDigits = 2): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function engineColor(engine: PendingTrade["engine"]): string {
  if (engine === "aggressive") return palette.status.warn;
  if (engine === "conservative") return palette.accent.gold;
  return palette.fg.subtle;
}

export function PendingTradeCard({
  trade,
  onApprove,
  onDeny,
  busy,
}: PendingTradeCardProps) {
  const [pending, setPending] = useState<"approve" | "deny" | null>(null);
  const disabled = busy || pending !== null;

  const directionLabel = trade.direction === "BUY" ? "Buy" : "Sell";
  const directionColor =
    trade.direction === "BUY" ? palette.status.success : palette.status.danger;

  const handleApprove = useCallback(() => {
    Alert.alert(
      `Approve ${directionLabel} ${trade.symbol}?`,
      `Tiwa will place a ${directionLabel.toLowerCase()} ${formatNumber(trade.lotSize, 2)} lots at ${formatNumber(trade.entryPrice)} on your MT5 account.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          style: "default",
          onPress: async () => {
            setPending("approve");
            try {
              await onApprove(trade.id);
            } finally {
              setPending(null);
            }
          },
        },
      ],
    );
  }, [trade, directionLabel, onApprove]);

  const handleDeny = useCallback(() => {
    Alert.alert(
      `Deny ${directionLabel} ${trade.symbol}?`,
      "Tiwa will skip this signal. You can still see it in the Trades feed.",
      [
        { text: "Keep waiting", style: "cancel" },
        {
          text: "Deny",
          style: "destructive",
          onPress: async () => {
            setPending("deny");
            try {
              await onDeny(trade.id);
            } finally {
              setPending(null);
            }
          },
        },
      ],
    );
  }, [trade, directionLabel, onDeny]);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.directionPill}>
          <Text variant="caption" style={[styles.directionText, { color: directionColor }]}>
            {directionLabel.toUpperCase()} {trade.symbol}
          </Text>
        </View>
        <Text variant="caption" style={[styles.engine, { color: engineColor(trade.engine) }]}>
          {trade.engine === "aggressive" ? "Aggressive" : trade.engine === "conservative" ? "Conservative" : "Engine"}
        </Text>
      </View>

      <View style={styles.priceRow}>
        <Text variant="display" style={styles.entry}>
          {formatNumber(trade.entryPrice)}
        </Text>
        <Text variant="caption" tone="muted">
          {trade.entryType} ENTRY
        </Text>
      </View>

      <View style={styles.metricsGrid}>
        <Metric label="Lot size" value={formatNumber(trade.lotSize, 2)} />
        <Metric label="Stop loss" value={formatNumber(trade.stopLoss)} />
        <Metric label="Take profit" value={formatNumber(trade.takeProfit)} />
        <Metric
          label="Risk : reward"
          value={trade.riskReward > 0 ? `1 : ${formatNumber(trade.riskReward, 2)}` : "—"}
        />
      </View>

      {trade.approvalExpiresAt && (
        <Text variant="caption" tone="muted" style={styles.expires}>
          Expires {new Date(trade.approvalExpiresAt).toLocaleTimeString()}
        </Text>
      )}

      <View style={styles.actionsRow}>
        <PressableScale
          onPress={handleDeny}
          disabled={disabled}
          style={[styles.btn, styles.btnDeny, disabled && styles.btnDisabled]}
        >
          <Text variant="title" style={styles.btnDenyText}>
            {pending === "deny" ? "Denying…" : "Deny"}
          </Text>
        </PressableScale>
        <PressableScale
          onPress={handleApprove}
          disabled={disabled}
          style={[styles.btn, styles.btnApprove, disabled && styles.btnDisabled]}
        >
          <Text variant="title" style={styles.btnApproveText}>
            {pending === "approve" ? "Approving…" : "Approve"}
          </Text>
        </PressableScale>
      </View>
    </GlassCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text variant="caption" tone="muted" style={styles.metricLabel}>
        {label.toUpperCase()}
      </Text>
      <Text variant="body" style={styles.metricValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  directionPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: palette.bg.elevated,
  },
  directionText: {
    fontFamily: font.sansWeights.semibold,
    letterSpacing: 0.6,
  },
  engine: {
    fontFamily: font.sansWeights.medium,
    letterSpacing: 0.4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
  },
  entry: {
    fontFamily: font.monoWeights.semibold,
    color: palette.fg.primary,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: spacing.sm,
    columnGap: spacing.lg,
  },
  metric: {
    minWidth: "40%",
    gap: 2,
  },
  metricLabel: {
    letterSpacing: 0.5,
  },
  metricValue: {
    fontFamily: font.monoWeights.medium,
    color: palette.fg.primary,
  },
  expires: {
    fontStyle: "italic",
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  btn: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDeny: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: palette.hairline,
  },
  btnDenyText: {
    color: palette.fg.muted,
    fontFamily: font.sansWeights.semibold,
  },
  btnApprove: {
    backgroundColor: palette.accent.gold,
  },
  btnApproveText: {
    color: palette.bg.base,
    fontFamily: font.sansWeights.semibold,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
