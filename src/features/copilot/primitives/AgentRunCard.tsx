import { memo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { GlassCard } from "@/design/primitives/GlassCard";
import { Text } from "@/design/primitives/Text";
import { color, spacing } from "@/design/tokens";
import type { CopilotAgentRun } from "@/types/copilot";
import { AgentRunTaskRow } from "./AgentRunTaskRow";

interface Props {
  run: CopilotAgentRun;
}

function failureLabel(reason?: string): string {
  if (!reason) return "Agent run failed";
  return reason;
}

export const AgentRunCard = memo(function AgentRunCard({ run }: Props) {
  const isCompleted = run.status === "completed";
  const isFailed = run.status === "failed";

  return (
    <GlassCard padded={false} style={styles.card}>
      <View style={styles.container}>
        {/* Header with prompt */}
        <View style={styles.header}>
          <Text
            style={styles.prompt}
            variant="body"
            tone="primary"
            weight="medium"
            numberOfLines={2}
          >
            {run.prompt}
          </Text>
        </View>

        {/* Failure banner */}
        {isFailed && (
          <Animated.View
            entering={FadeIn.duration(180)}
            style={[styles.failureBanner]}
          >
            <Text
              style={styles.failureText}
              variant="body"
              tone="danger"
              numberOfLines={2}
            >
              {failureLabel(run.failureReason)}
            </Text>
          </Animated.View>
        )}

        {/* Agent tasks list */}
        {run.agents.length > 0 && (
          <View style={styles.taskList}>
            {run.agents.map((agent) => (
              <AgentRunTaskRow key={agent.taskIndex} task={agent} />
            ))}
          </View>
        )}

        {/* Synthesis report section */}
        {!isFailed && (
          <Animated.View
            entering={FadeIn.duration(180)}
            style={styles.synthesis}
          >
            {isCompleted && run.synthesisReport ? (
              <View style={styles.reportContainer}>
                <Text
                  style={styles.reportLabel}
                  variant="caption"
                  tone="muted"
                  weight="medium"
                >
                  SYNTHESIS REPORT
                </Text>
                <Text
                  style={styles.reportText}
                  variant="body"
                  tone="primary"
                >
                  {run.synthesisReport}
                </Text>
              </View>
            ) : (
              <Text
                style={styles.compilingText}
                variant="body"
                tone="muted"
              >
                Compiling report…
              </Text>
            )}
          </Animated.View>
        )}
      </View>
    </GlassCard>
  );
});

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  container: {
    backgroundColor: "transparent",
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomColor: color.divider,
    borderBottomWidth: 1,
  },
  prompt: {
    lineHeight: 20,
  },
  failureBanner: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: "rgba(229,96,77,0.10)",
    borderBottomColor: color.divider,
    borderBottomWidth: 1,
  },
  failureText: {
    lineHeight: 20,
  },
  taskList: {
    borderBottomColor: color.divider,
    borderBottomWidth: 1,
  },
  synthesis: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  reportContainer: {
    gap: spacing.sm,
  },
  reportLabel: {
    letterSpacing: 1,
  },
  reportText: {
    lineHeight: 20,
  },
  compilingText: {
    textAlign: "center",
    paddingVertical: spacing.sm,
  },
});
