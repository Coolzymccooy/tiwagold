import { StyleSheet, View } from "react-native";
import { Text } from "@/design/primitives";
import { spacing } from "@/design/tokens";
import type { TradeLevelRow } from "../types";

export interface LevelGridProps {
  rows: TradeLevelRow[];
}

export function LevelGrid({ rows }: LevelGridProps) {
  return (
    <View style={styles.grid}>
      {rows.map((row) => (
        <View key={row.label} style={styles.cell}>
          <Text variant="caption" tone="subtle">
            {row.label}
          </Text>
          <Text variant="title" weight="semibold">
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  cell: {
    flexBasis: "30%",
    flexGrow: 1,
    gap: spacing.xs,
  },
});
