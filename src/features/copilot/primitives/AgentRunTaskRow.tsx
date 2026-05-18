import { memo, useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Text } from "@/design/primitives/Text";
import { color, radius, spacing } from "@/design/tokens";
import type { CopilotAgentRunTask } from "@/types/copilot";

interface Props {
  task: CopilotAgentRunTask;
}

function statusPill(
  status: CopilotAgentRunTask["status"]
): {
  label: string;
  bg: string;
  fg: string;
} {
  switch (status) {
    case "queued":
      return {
        label: "queued",
        bg: color.surfaceMuted,
        fg: color.textSecondary,
      };
    case "running":
      return { label: "running", bg: color.amberSoft, fg: color.amber };
    case "completed":
      return {
        label: "done",
        bg: color.successSoft,
        fg: color.success,
      };
    case "failed":
      return { label: "failed", bg: color.dangerSoft, fg: color.danger };
  }
}

function formatDuration(ms: number | undefined): string {
  if (ms == null) return "";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export const AgentRunTaskRow = memo(function AgentRunTaskRow({ task }: Props) {
  const [expanded, setExpanded] = useState(false);
  const pill = statusPill(task.status);
  const canExpand = Boolean(task.resultText || task.error);

  const onPress = useCallback(() => {
    if (!canExpand) return;
    void Haptics.selectionAsync();
    setExpanded((prev) => !prev);
  }, [canExpand]);

  return (
    <Pressable onPress={onPress} disabled={!canExpand}>
      <Animated.View
        entering={FadeIn.duration(180)}
        layout={LinearTransition.duration(220)}
        style={styles.container}
      >
        <View style={styles.headerRow}>
          <Text
            style={styles.name}
            variant="body"
            tone="primary"
            weight="medium"
          >
            {task.name}
          </Text>
          <View style={[styles.pill, { backgroundColor: pill.bg }]}>
            <Text
              style={[styles.pillText, { color: pill.fg }]}
              variant="caption"
              tone="primary"
            >
              {pill.label}
            </Text>
          </View>
          {task.durationMs != null ? (
            <Text
              style={styles.duration}
              variant="caption"
              tone="muted"
              family="mono"
            >
              {formatDuration(task.durationMs)}
            </Text>
          ) : null}
        </View>
        {task.milestones.length > 0 ? (
          <Text
            style={styles.milestones}
            variant="caption"
            tone="muted"
            numberOfLines={2}
          >
            {task.milestones.join(" · ")}
          </Text>
        ) : null}
        {expanded && (task.resultText || task.error) ? (
          <Text
            style={styles.detail}
            variant="body"
            tone={task.error ? "danger" : "primary"}
          >
            {task.error ?? task.resultText}
          </Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomColor: color.divider,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  name: {
    flex: 1,
  },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  pillText: {
    fontSize: 10,
  },
  duration: {
    minWidth: 40,
  },
  milestones: {
    marginTop: spacing.xs,
  },
  detail: {
    marginTop: spacing.sm,
  },
});
