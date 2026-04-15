import { StyleSheet, View } from "react-native";
import { Text } from "@/design/primitives";
import { palette, spacing } from "@/design/tokens";

export interface BreakdownRow {
  id: string;
  label: string;
  tradesLabel: string;
  winRateLabel: string;
  avgRLabel: string;
  avgRTone: "primary" | "success" | "danger";
}

interface BreakdownListProps {
  rows: BreakdownRow[];
}

export function BreakdownList({ rows }: BreakdownListProps) {
  if (rows.length === 0) {
    return null;
  }
  return (
    <View style={styles.container}>
      {rows.map((row, index) => (
        <View key={row.id} style={styles.rowWrap}>
          <View style={styles.row}>
            <View style={styles.labelCol}>
              <Text variant="body" weight="semibold">
                {row.label}
              </Text>
              <Text variant="caption" tone="muted">
                {row.tradesLabel}
              </Text>
            </View>
            <View style={styles.metricCol}>
              <Text variant="body" weight="semibold">
                {row.winRateLabel}
              </Text>
              <Text variant="caption" tone="muted">
                Win rate
              </Text>
            </View>
            <View style={styles.metricCol}>
              <Text variant="body" weight="semibold" tone={row.avgRTone}>
                {row.avgRLabel}
              </Text>
              <Text variant="caption" tone="muted">
                Avg R
              </Text>
            </View>
          </View>
          {index < rows.length - 1 ? <View style={styles.divider} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  rowWrap: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  labelCol: {
    flex: 1,
    gap: 2,
  },
  metricCol: {
    minWidth: 72,
    alignItems: "flex-end",
    gap: 2,
  },
  divider: {
    height: 1,
    backgroundColor: palette.hairline,
  },
});
