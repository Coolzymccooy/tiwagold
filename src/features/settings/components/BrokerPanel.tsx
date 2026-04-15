import { StyleSheet, View } from "react-native";
import { PressableScale, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import type { SettingsBrokerRow } from "../types";

interface BrokerPanelProps {
  broker: SettingsBrokerRow;
  connectLabel: string;
  disconnectLabel: string;
  lastSyncedLabel: string;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function BrokerPanel({
  broker,
  connectLabel,
  disconnectLabel,
  lastSyncedLabel,
  onConnect,
  onDisconnect,
}: BrokerPanelProps) {
  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={[styles.dot, broker.connected ? styles.dotOn : styles.dotOff]} />
        <Text variant="body" weight="semibold">
          {broker.statusLabel}
        </Text>
      </View>

      {broker.connected && broker.accountLabel ? (
        <View style={styles.detailGrid}>
          <Row label="Account" value={broker.accountLabel} />
          {broker.kindLabel ? <Row label="Platform" value={broker.kindLabel} /> : null}
          {broker.balanceLabel ? <Row label="Balance" value={broker.balanceLabel} /> : null}
          {broker.equityLabel ? (
            <Row label="Equity" value={broker.equityLabel} tone="accent" />
          ) : null}
          {broker.lastSyncedLabel ? (
            <Row
              label={lastSyncedLabel}
              value={broker.lastSyncedLabel}
              tone="muted"
            />
          ) : null}
        </View>
      ) : null}

      <PressableScale
        onPress={broker.connected ? onDisconnect : onConnect}
        style={[styles.cta, broker.connected ? styles.ctaSecondary : styles.ctaPrimary]}
      >
        <Text
          variant="body"
          weight="semibold"
          tone={broker.connected ? "primary" : "accent"}
        >
          {broker.connected ? disconnectLabel : connectLabel}
        </Text>
      </PressableScale>
    </View>
  );
}

interface RowProps {
  label: string;
  value: string;
  tone?: "primary" | "muted" | "accent";
}

function Row({ label, value, tone = "primary" }: RowProps) {
  return (
    <View style={styles.row}>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <Text variant="body" weight="medium" tone={tone}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  dotOn: {
    backgroundColor: palette.status.success,
  },
  dotOff: {
    backgroundColor: palette.fg.subtle,
  },
  detailGrid: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cta: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
  },
  ctaPrimary: {
    backgroundColor: palette.bg.glass,
    borderColor: palette.accent.goldDeep,
  },
  ctaSecondary: {
    backgroundColor: "transparent",
    borderColor: palette.hairline,
  },
});
