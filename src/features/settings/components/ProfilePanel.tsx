import { StyleSheet, View } from "react-native";
import { Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import type { SettingsProfileRow } from "../types";

interface ProfilePanelProps {
  profile: SettingsProfileRow;
}

export function ProfilePanel({ profile }: ProfilePanelProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text variant="title" weight="bold" tone="accent">
            {initial(profile.displayName)}
          </Text>
        </View>
        <View style={styles.identity}>
          <Text variant="title" weight="semibold">
            {profile.displayName}
          </Text>
          <Text variant="caption" tone="muted">
            {profile.email}
          </Text>
        </View>
        <View style={styles.tierPill}>
          <Text variant="caption" weight="semibold" tone="accent">
            {profile.tierLabel}
          </Text>
        </View>
      </View>
      <View style={styles.meta}>
        <Text variant="caption" tone="muted">
          Member since
        </Text>
        <Text variant="caption" weight="medium">
          {profile.memberSinceLabel}
        </Text>
      </View>
    </View>
  );
}

function initial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: palette.bg.glass,
    borderWidth: 1,
    borderColor: palette.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  tierPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.accent.goldDeep,
    backgroundColor: palette.bg.glass,
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
