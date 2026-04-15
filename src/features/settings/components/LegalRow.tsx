import { StyleSheet, View } from "react-native";
import { PressableScale, Text } from "@/design/primitives";
import { palette, spacing } from "@/design/tokens";
import type { LegalLinkId, SettingsLegalRow } from "../types";

interface LegalRowProps {
  row: SettingsLegalRow;
  onPress: (id: LegalLinkId) => void;
  isLast: boolean;
}

export function LegalRow({ row, onPress, isLast }: LegalRowProps) {
  return (
    <View>
      <PressableScale onPress={() => onPress(row.id)} style={styles.row}>
        <Text variant="body" weight="medium">
          {row.label}
        </Text>
        <Text variant="body" tone="muted">
          ›
        </Text>
      </PressableScale>
      {isLast ? null : <View style={styles.divider} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: palette.hairline,
  },
});
