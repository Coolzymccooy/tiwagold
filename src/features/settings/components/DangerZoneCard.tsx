import { useCallback } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { GlassCard, PressableScale, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import { COPY } from "@/content/copy";

interface DangerZoneCardProps {
  onConfirmDelete: () => void;
  isDeleting: boolean;
}

export function DangerZoneCard({
  onConfirmDelete,
  isDeleting,
}: DangerZoneCardProps) {
  const finalConfirm = useCallback(() => {
    const final = COPY.settings.danger.finalConfirm;
    Alert.alert(final.title, final.body, [
      { text: final.cancel, style: "cancel" },
      { text: final.confirm, style: "destructive", onPress: onConfirmDelete },
    ]);
  }, [onConfirmDelete]);

  const handlePress = useCallback(() => {
    if (isDeleting) return;
    const first = COPY.settings.danger.firstConfirm;
    Alert.alert(first.title, first.body, [
      { text: first.cancel, style: "cancel" },
      { text: first.confirm, style: "destructive", onPress: finalConfirm },
    ]);
  }, [finalConfirm, isDeleting]);

  const label = isDeleting
    ? COPY.settings.danger.deleting
    : COPY.settings.danger.delete;

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Text variant="title" weight="semibold" tone="danger">
          {COPY.settings.danger.title}
        </Text>
        <Text variant="caption" tone="muted">
          {COPY.settings.danger.subtitle}
        </Text>
      </View>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={handlePress}
        disabled={isDeleting}
        style={styles.button}
      >
        <View style={styles.buttonContent}>
          {isDeleting ? (
            <ActivityIndicator color={palette.status.danger} />
          ) : (
            <Text variant="body" weight="semibold" tone="danger">
              {label}
            </Text>
          )}
        </View>
      </PressableScale>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    borderColor: palette.status.danger,
  },
  header: {
    gap: spacing.xs,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.status.danger,
    backgroundColor: "transparent",
  },
  buttonContent: {
    alignItems: "center",
    justifyContent: "center",
  },
});
