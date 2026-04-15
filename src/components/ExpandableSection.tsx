import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  LayoutChangeEvent,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ChevronDown, Lock } from "lucide-react-native";
import { GlassCard, PressableScale, Text } from "@/design/primitives";
import { duration, palette, radius, spacing } from "@/design/tokens";

export interface ExpandableSectionProps {
  title: string;
  caption?: string;
  defaultExpanded?: boolean;
  locked?: boolean;
  lockReason?: string;
  trailing?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ExpandableSection({
  title,
  caption,
  defaultExpanded = false,
  locked = false,
  lockReason,
  trailing,
  children,
  style,
}: ExpandableSectionProps) {
  const reducedMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [contentHeight, setContentHeight] = useState(0);
  const heightValue = useSharedValue(0);
  const opacityValue = useSharedValue(defaultExpanded ? 1 : 0);
  const chevron = useSharedValue(defaultExpanded ? 1 : 0);

  useEffect(() => {
    const targetHeight = expanded ? contentHeight : 0;
    const targetOpacity = expanded ? 1 : 0;
    const targetChevron = expanded ? 1 : 0;
    const heightDuration = reducedMotion ? 0 : duration.base;
    const opacityDuration = reducedMotion
      ? 120
      : Math.min(duration.base, 180);
    heightValue.value = withTiming(targetHeight, {
      duration: heightDuration,
    });
    opacityValue.value = withTiming(targetOpacity, {
      duration: opacityDuration,
    });
    chevron.value = withTiming(targetChevron, {
      duration: reducedMotion ? 0 : duration.fast,
    });
  }, [expanded, contentHeight, reducedMotion, chevron, heightValue, opacityValue]);

  const toggle = useCallback(() => {
    if (locked) return;
    setExpanded((prev) => !prev);
  }, [locked]);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    height: heightValue.value,
    opacity: opacityValue.value,
  }));

  const chevronAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevron.value * 180}deg` }],
  }));

  const onMeasure = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    if (next > 0) {
      setContentHeight((prev) => (Math.abs(prev - next) > 0.5 ? next : prev));
    }
  }, []);

  return (
    <GlassCard padded={false} style={[styles.card, style]}>
      <PressableScale
        accessibilityRole="button"
        accessibilityState={{ expanded, disabled: locked }}
        accessibilityHint={locked ? lockReason : undefined}
        onPress={toggle}
        disabled={locked}
        style={styles.header}
      >
        <View style={styles.headerText}>
          <Text variant="caption" tone="muted" weight="semibold">
            {title.toUpperCase()}
          </Text>
          {caption ? (
            <Text variant="body" tone="primary" weight="semibold">
              {caption}
            </Text>
          ) : null}
        </View>
        <View style={styles.trailing}>
          {trailing}
          {locked ? (
            <View style={styles.lockBadge}>
              <Lock size={12} color={palette.fg.subtle} />
              <Text variant="caption" tone="subtle" weight="semibold">
                {(lockReason ?? "Locked").toUpperCase()}
              </Text>
            </View>
          ) : (
            <Animated.View style={chevronAnimatedStyle}>
              <ChevronDown size={18} color={palette.fg.muted} />
            </Animated.View>
          )}
        </View>
      </PressableScale>

      <Animated.View style={[styles.clip, contentAnimatedStyle]}>
        <View style={styles.measure} onLayout={onMeasure}>
          <View style={styles.contentInner}>{children}</View>
        </View>
      </Animated.View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  trailing: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  lockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.hairline,
  },
  clip: {
    overflow: "hidden",
  },
  measure: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
  },
  contentInner: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xs,
    gap: spacing.md,
  },
});
