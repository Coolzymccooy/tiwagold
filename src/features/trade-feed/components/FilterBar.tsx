import { StyleSheet, View } from "react-native";
import { PressableScale, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import type { TradeFeedFilter } from "../types";

export interface FilterBarProps {
  value: TradeFeedFilter;
  onChange: (next: TradeFeedFilter) => void;
  labels: Record<TradeFeedFilter, string>;
}

const ORDER: TradeFeedFilter[] = ["all", "active", "pending", "closed"];

export function FilterBar({ value, onChange, labels }: FilterBarProps) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {ORDER.map((key) => {
        const selected = value === key;
        return (
          <PressableScale
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(key)}
            style={[styles.chip, selected ? styles.chipSelected : null]}
          >
            <Text
              variant="caption"
              weight="semibold"
              tone={selected ? "accent" : "muted"}
            >
              {labels[key]}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.hairline,
    backgroundColor: palette.bg.elevated,
  },
  chipSelected: {
    borderColor: palette.accent.gold,
    backgroundColor: "rgba(233,177,76,0.10)",
  },
});
