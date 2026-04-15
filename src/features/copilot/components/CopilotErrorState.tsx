import { StyleSheet, View } from "react-native";
import { PressableScale } from "@/design/primitives/PressableScale";
import { Text } from "@/design/primitives/Text";
import { palette, radius, spacing } from "@/design/tokens";
import { COPY } from "@/content/copy";

export interface CopilotErrorStateProps {
  onRetry: () => void;
}

export function CopilotErrorState({ onRetry }: CopilotErrorStateProps) {
  return (
    <View style={styles.centered}>
      <Text variant="title" weight="semibold">
        {COPY.copilot.error.title}
      </Text>
      <Text variant="body" tone="muted" align="center" style={styles.centeredText}>
        {COPY.copilot.error.body}
      </Text>
      <PressableScale
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={COPY.copilot.error.retry}
        style={styles.retryButton}
      >
        <Text variant="caption" tone="primary" weight="semibold">
          {COPY.copilot.error.retry}
        </Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  centeredText: {
    marginTop: spacing.sm,
  },
  retryButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: palette.accent.goldDeep,
  },
});
