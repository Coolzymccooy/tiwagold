import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Text } from "@/design/primitives/Text";
import { palette, spacing } from "@/design/tokens";
import { COPY } from "@/content/copy";

export function CopilotLoadingState() {
  return (
    <View style={styles.centered}>
      <ActivityIndicator color={palette.accent.gold} />
      <Text variant="body" tone="muted" style={styles.centeredText}>
        {COPY.copilot.sending}
      </Text>
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
});
