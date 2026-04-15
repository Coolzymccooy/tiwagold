import { StyleSheet, Switch, View } from "react-native";
import { Text } from "@/design/primitives";
import { palette, spacing } from "@/design/tokens";
import type { NotificationToggleId, SettingsNotificationRow } from "../types";

interface NotificationToggleRowProps {
  row: SettingsNotificationRow;
  onToggle: (id: NotificationToggleId, next: boolean) => void;
}

export function NotificationToggleRow({ row, onToggle }: NotificationToggleRowProps) {
  return (
    <View style={styles.row}>
      <Text variant="body" weight="medium" style={styles.label}>
        {row.label}
      </Text>
      <Switch
        value={row.enabled}
        onValueChange={(next) => onToggle(row.id, next)}
        trackColor={{ false: palette.hairline, true: palette.accent.goldDeep }}
        thumbColor={row.enabled ? palette.accent.goldBright : palette.fg.muted}
        ios_backgroundColor={palette.hairline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  label: {
    flex: 1,
  },
});
