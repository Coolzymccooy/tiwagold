import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { GlassCard } from "@/design/primitives/GlassCard";
import { Text } from "@/design/primitives/Text";
import { duration, easing, palette, radius, spacing } from "@/design/tokens";
import type { CopilotMessageRow } from "../types";

export interface MessageBubbleProps {
  row: CopilotMessageRow;
}

export function MessageBubble({ row }: MessageBubbleProps) {
  if (row.isUser) {
    return (
      <View style={styles.userAlign}>
        <View style={styles.userBubble}>
          <Text variant="body" tone="primary" weight="medium">
            {row.content}
          </Text>
          <MessageMeta row={row} />
        </View>
      </View>
    );
  }

  return <AssistantBubble row={row} />;
}

function AssistantBubble({ row }: { row: CopilotMessageRow }) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      progress.value = withTiming(1, { duration: 120 });
      return;
    }
    progress.value = withTiming(1, {
      duration: duration.base,
      easing: Easing.bezier(
        easing.gentle[0],
        easing.gentle[1],
        easing.gentle[2],
        easing.gentle[3],
      ),
    });
  }, [progress, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: reducedMotion ? 0 : 8 * (1 - progress.value) },
    ],
  }));

  return (
    <Animated.View style={[styles.assistantAlign, animatedStyle]}>
      <GlassCard padded={false} style={styles.assistantShell}>
        <View style={styles.assistantInner}>
          <Text variant="caption" tone="accent" weight="semibold">
            COPILOT
          </Text>
          <Text variant="body" tone="primary" style={styles.assistantBody}>
            {row.content}
          </Text>
          {row.citationLabels.length > 0 ? (
            <View style={styles.citations}>
              {row.citationLabels.map((label) => (
                <CitationChip key={label} label={label} />
              ))}
            </View>
          ) : null}
          <MessageMeta row={row} />
        </View>
      </GlassCard>
    </Animated.View>
  );
}

function MessageMeta({ row }: { row: CopilotMessageRow }) {
  const statusLabel = resolveStatusLabel(row.status);
  return (
    <View style={styles.meta}>
      {row.timestampLabel ? (
        <Text variant="caption" tone="subtle">
          {row.timestampLabel}
        </Text>
      ) : null}
      {statusLabel ? (
        <Text
          variant="caption"
          tone={row.status === "error" ? "danger" : "muted"}
        >
          {statusLabel}
        </Text>
      ) : null}
    </View>
  );
}

function CitationChip({ label }: { label: string }) {
  return (
    <View style={styles.citationChip}>
      <Text variant="caption" tone="muted" weight="medium">
        {label}
      </Text>
    </View>
  );
}

function resolveStatusLabel(status: CopilotMessageRow["status"]): string | null {
  if (status === "streaming") return "Streaming…";
  if (status === "queued") return "Queued";
  if (status === "error") return "Failed";
  return null;
}

const styles = StyleSheet.create({
  userAlign: {
    alignItems: "flex-end",
    marginBottom: spacing.md,
  },
  assistantAlign: {
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  userBubble: {
    maxWidth: "86%",
    backgroundColor: palette.accent.goldDeep,
    borderRadius: radius.lg,
    borderTopRightRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  assistantShell: {
    maxWidth: "92%",
    borderTopLeftRadius: radius.sm,
  },
  assistantInner: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  assistantBody: {
    marginTop: spacing.xs,
  },
  citations: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  citationChip: {
    borderWidth: 1,
    borderColor: palette.hairline,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  meta: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
