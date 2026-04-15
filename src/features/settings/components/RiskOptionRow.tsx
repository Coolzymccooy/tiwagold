import { StyleSheet, View } from "react-native";
import { PressableScale, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import type { RiskProfileId, SettingsRiskRow } from "../types";

interface RiskOptionRowProps {
  row: SettingsRiskRow;
  onSelect: (id: RiskProfileId) => void;
}

export function RiskOptionRow({ row, onSelect }: RiskOptionRowProps) {
  return (
    <PressableScale
      onPress={() => onSelect(row.id)}
      style={[styles.row, row.selected ? styles.rowSelected : styles.rowIdle]}
    >
      <View style={styles.indicator}>
        <View
          style={[
            styles.indicatorDot,
            row.selected ? styles.indicatorDotOn : styles.indicatorDotOff,
          ]}
        />
      </View>
      <View style={styles.copy}>
        <Text
          variant="body"
          weight="semibold"
          tone={row.selected ? "accent" : "primary"}
        >
          {row.label}
        </Text>
        <Text variant="caption" tone="muted">
          {row.hint}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  rowIdle: {
    borderColor: palette.hairline,
    backgroundColor: "transparent",
  },
  rowSelected: {
    borderColor: palette.accent.goldDeep,
    backgroundColor: palette.bg.glass,
  },
  indicator: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
  indicatorDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
  },
  indicatorDotOn: {
    backgroundColor: palette.accent.gold,
  },
  indicatorDotOff: {
    backgroundColor: "transparent",
  },
  copy: {
    flex: 1,
    gap: 2,
  },
});
