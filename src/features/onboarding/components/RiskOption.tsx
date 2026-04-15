import { StyleSheet, View } from "react-native";
import { PressableScale, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";

export interface RiskOptionProps {
  label: string;
  hint: string;
  selected: boolean;
  onSelect: () => void;
}

export function RiskOption({ label, hint, selected, onSelect }: RiskOptionProps) {
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onSelect}
      style={[styles.row, selected ? styles.rowSelected : null]}
    >
      <View style={styles.text}>
        <Text variant="title" weight="semibold">
          {label}
        </Text>
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      </View>
      <View style={[styles.indicator, selected ? styles.indicatorOn : null]} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.hairline,
    backgroundColor: palette.bg.elevated,
  },
  rowSelected: {
    borderColor: palette.accent.gold,
    backgroundColor: "rgba(233,177,76,0.10)",
  },
  text: {
    gap: spacing.xs,
    flex: 1,
  },
  indicator: {
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.hairline,
  },
  indicatorOn: {
    backgroundColor: palette.accent.gold,
    borderColor: palette.accent.gold,
  },
});
