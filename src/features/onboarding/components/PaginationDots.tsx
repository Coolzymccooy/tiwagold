import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { duration, easing, palette, radius, spacing } from "@/design/tokens";

export interface PaginationDotsProps {
  total: number;
  activeIndex: number;
  reducedMotion?: boolean;
}

export function PaginationDots({
  total,
  activeIndex,
  reducedMotion = false,
}: PaginationDotsProps) {
  return (
    <View
      style={styles.row}
      accessibilityRole="tablist"
      accessibilityLabel="Onboarding pages"
    >
      {Array.from({ length: total }, (_, index) => (
        <Dot
          key={index}
          isActive={index === activeIndex}
          reducedMotion={reducedMotion}
          index={index}
        />
      ))}
    </View>
  );
}

interface DotProps {
  isActive: boolean;
  reducedMotion: boolean;
  index: number;
}

function Dot({ isActive, reducedMotion, index }: DotProps) {
  const progress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    const target = isActive ? 1 : 0;
    if (reducedMotion) {
      progress.value = target;
      return;
    }
    progress.value = withTiming(target, {
      duration: duration.base,
      easing: Easing.bezier(...easing.gentle),
    });
  }, [isActive, progress, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: 8 + progress.value * 16,
    opacity: 0.35 + progress.value * 0.65,
  }));

  return (
    <Animated.View
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`Page ${index + 1}`}
      style={[styles.dot, animatedStyle]}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: palette.accent.gold,
  },
});
