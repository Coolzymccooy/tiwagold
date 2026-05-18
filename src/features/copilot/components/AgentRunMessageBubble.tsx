import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/design/primitives/GlassCard";
import { Text } from "@/design/primitives/Text";
import { duration, easing, radius, spacing } from "@/design/tokens";
import { fetchCopilotAgentRunLive, copilotKeys } from "@/services/copilot";
import { useAuthStore } from "@/state/authStore";
import type { CopilotMessageRow } from "../types";
import { AgentRunCard } from "../primitives/AgentRunCard";

export interface AgentRunMessageBubbleProps {
  row: CopilotMessageRow;
}

export function AgentRunMessageBubble({ row }: AgentRunMessageBubbleProps) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const session = useAuthStore((state) => state.session);
  const bearerToken = session?.access.value;

  // Poll the agent run with 800ms interval
  const { data: run, isLoading } = useQuery({
    queryKey: copilotKeys.run(row.runId!),
    queryFn: () => fetchCopilotAgentRunLive(row.runId!, bearerToken!),
    refetchInterval: 800,
    refetchIntervalInBackground: true,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    enabled: !!row.runId && !!bearerToken,
  });

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

  if (isLoading || !run) {
    return (
      <Animated.View style={[styles.align, animatedStyle]}>
        <GlassCard padded={false} style={styles.shell}>
          <Text
            style={styles.loadingText}
            variant="body"
            tone="muted"
          >
            Loading agent run…
          </Text>
        </GlassCard>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.align, animatedStyle]}>
      <GlassCard padded={false} style={styles.shell}>
        <AgentRunCard run={run} />
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  align: {
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  shell: {
    maxWidth: "92%",
    borderTopLeftRadius: radius.sm,
  },
  loadingText: {
    padding: spacing.lg,
    textAlign: "center",
  },
});
