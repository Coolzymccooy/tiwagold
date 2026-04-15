import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { duration, easing, palette, radius } from "@/design/tokens";

export interface ProgressBarProps {
  progress: number;
}

export function ProgressBar({ progress }: ProgressBarProps) {
  const value = useSharedValue(progress);

  useEffect(() => {
    value.value = withTiming(progress, {
      duration: duration.slow,
      easing: Easing.bezier(...easing.gentle),
    });
  }, [progress, value]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(1, value.value)) * 100}%`,
  }));

  return (
    <View style={styles.track} accessibilityRole="progressbar">
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: palette.hairline,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: palette.accent.gold,
  },
});
