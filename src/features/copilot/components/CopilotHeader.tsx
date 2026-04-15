import { StyleSheet, View } from "react-native";
import { Text } from "@/design/primitives/Text";
import { spacing } from "@/design/tokens";
import { COPY } from "@/content/copy";

export interface CopilotHeaderProps {
  subtitle: string;
}

export function CopilotHeader({ subtitle }: CopilotHeaderProps) {
  return (
    <View style={styles.header}>
      <Text variant="headline" weight="bold">
        {COPY.copilot.title}
      </Text>
      <Text variant="caption" tone="muted">
        {subtitle}
      </Text>
      <Text variant="caption" tone="subtle" style={styles.disclaimer}>
        {COPY.copilot.disclaimer}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  disclaimer: {
    marginTop: spacing.xs,
  },
});
