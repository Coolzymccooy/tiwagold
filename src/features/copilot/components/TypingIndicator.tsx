import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { GlassCard } from "@/design/primitives/GlassCard";
import { Text } from "@/design/primitives/Text";
import { duration, palette, radius, spacing } from "@/design/tokens";
import { COPY } from "@/content/copy";

const DOT_COUNT = 3;
const DOT_STAGGER = 140;
const DOT_HOLD = duration.base;
const FADE_ONLY_DURATION = 140;

export function TypingIndicator() {
  return (
    <View style={styles.align} accessibilityLiveRegion="polite">
      <GlassCard padded={false} style={styles.shell}>
        <View style={styles.inner}>
          <Text variant="caption" tone="accent" weight="semibold">
            COPILOT
          </Text>
          <View
            style={styles.dots}
            accessibilityLabel={COPY.copilot.typing}
            accessible
          >
            {Array.from({ length: DOT_COUNT }).map((_, index) => (
              <TypingDot key={index} index={index} />
            ))}
          </View>
          <Text variant="caption" tone="muted">
            {COPY.copilot.typing}
          </Text>
        </View>
      </GlassCard>
    </View>
  );
}

interface TypingDotProps {
  index: number;
}

function TypingDot({ index }: TypingDotProps) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      progress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: FADE_ONLY_DURATION }),
          withTiming(0.4, { duration: FADE_ONLY_DURATION }),
        ),
        -1,
        true,
      );
      return;
    }
    progress.value = withDelay(
      index * DOT_STAGGER,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: DOT_HOLD,
            easing: Easing.bezier(0.32, 0.72, 0, 1),
          }),
          withTiming(0, {
            duration: DOT_HOLD,
            easing: Easing.bezier(0.32, 0.72, 0, 1),
          }),
        ),
        -1,
        false,
      ),
    );
  }, [index, progress, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = 0.35 + progress.value * 0.65;
    const translateY = reducedMotion ? 0 : -3 * progress.value;
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
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
  inner: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: palette.accent.gold,
  },
});
