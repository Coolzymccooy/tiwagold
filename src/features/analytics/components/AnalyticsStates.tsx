import { ActivityIndicator, StyleSheet } from "react-native";
import { GlassCard, PressableScale, Screen, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import { COPY } from "@/content/copy";

export function AnalyticsLoading() {
  return (
    <Screen padded>
      <GlassCard style={styles.stateCard}>
        <ActivityIndicator color={palette.accent.gold} />
      </GlassCard>
    </Screen>
  );
}

interface AnalyticsErrorProps {
  onRetry: () => void;
}

export function AnalyticsError({ onRetry }: AnalyticsErrorProps) {
  return (
    <Screen padded>
      <GlassCard style={styles.stateCard}>
        <Text variant="title" weight="semibold" align="center" tone="danger">
          {COPY.analytics.empty.title}
        </Text>
        <Text variant="body" tone="muted" align="center">
          {COPY.analytics.empty.body}
        </Text>
        <PressableScale
          accessibilityRole="button"
          onPress={onRetry}
          style={styles.retry}
        >
          <Text variant="title" weight="semibold" align="center">
            {COPY.common.retry}
          </Text>
        </PressableScale>
      </GlassCard>
    </Screen>
  );
}

export function AnalyticsEmpty() {
  return (
    <Screen padded>
      <GlassCard style={styles.stateCard}>
        <Text variant="title" weight="semibold" align="center">
          {COPY.analytics.empty.title}
        </Text>
        <Text variant="body" tone="muted" align="center">
          {COPY.analytics.empty.body}
        </Text>
      </GlassCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stateCard: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  retry: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.accent.gold,
  },
});
