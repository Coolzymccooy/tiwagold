import { StyleSheet, View } from "react-native";
import { PressableScale, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import type { TradeFeedCounts, TradeFeedFilter } from "../types";

export interface FilterBarProps {
  value: TradeFeedFilter;
  onChange: (next: TradeFeedFilter) => void;
  labels: Record<TradeFeedFilter, string>;
  counts?: TradeFeedCounts;
}

const ORDER: TradeFeedFilter[] = ["all", "pending", "active", "closed"];

const COUNT_KEY: Record<TradeFeedFilter, keyof TradeFeedCounts> = {
  all: "all",
  active: "active",
  pending: "pending",
  closed: "closed",
};

export function FilterBar({ value, onChange, labels, counts }: FilterBarProps) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {ORDER.map((key) => {
        const selected = value === key;
        const count = counts?.[COUNT_KEY[key]];
        const showBadge = key !== "all" && typeof count === "number" && count > 0;
        return (
          <PressableScale
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(key)}
            style={styles.tab}
          >
            <View style={styles.tabInner}>
              <Text
                variant="caption"
                weight="bold"
                tone={selected ? "primary" : "muted"}
              >
                {labels[key].toUpperCase()}
              </Text>
              {showBadge ? (
                <View style={styles.badge}>
                  <Text variant="caption" tone="primary" weight="bold">
                    {count}
                  </Text>
                </View>
              ) : null}
            </View>
            <View
              style={[
                styles.indicator,
                selected ? styles.indicatorActive : null,
              ]}
            />
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  tab: {
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  tabInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: palette.accent.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  indicator: {
    height: 2,
    borderRadius: radius.pill,
    backgroundColor: "transparent",
  },
  indicatorActive: {
    backgroundColor: palette.accent.gold,
  },
});
