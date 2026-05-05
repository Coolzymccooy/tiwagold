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
          <Text variant="headline" weight="bold" tone="accent">
            {initial(profile.displayName)}
          </Text>
        </View>
        <View style={styles.identity}>
          <Text variant="title" weight="semibold" numberOfLines={1}>
            {profile.displayName}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {profile.email}
          </Text>
          <View style={styles.tierPill}>
            <View style={styles.tierDot} />
            <Text variant="caption" weight="semibold" tone="accent">
              {profile.tierLabel}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Text variant="caption" tone="muted">
          {profile.isDemo ? "Status" : "Member since"}
        </Text>
        <Text variant="caption" weight="medium">
          {profile.memberSinceLabel}
        </Text>
      </View>
      {profile.demoNote ? (
        <Text variant="caption" tone="subtle">
          {profile.demoNote}
        </Text>
      ) : null}
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
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: "rgba(233,177,76,0.10)",
    borderWidth: 1,
    borderColor: palette.accent.goldDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  identity: {
    flex: 1,
    gap: 4,
  },
  tierPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.accent.goldDeep,
    backgroundColor: "rgba(233,177,76,0.10)",
  },
  tierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.accent.gold,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
