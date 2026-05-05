import { useEffect, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { palette, radius, spacing } from "../tokens";

export interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
  trackColor?: string;
  fillColor?: string;
  thumbColor?: string;
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  trackColor = palette.hairline,
  fillColor = palette.accent.gold,
  thumbColor = palette.accent.gold,
}: SliderProps) {
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(0);
  const dragStart = useSharedValue(0);

  const range = Math.max(1, max - min);

  useEffect(() => {
    const clamped = Math.min(max, Math.max(min, value));
    progress.value = (clamped - min) / range;
  }, [value, min, max, range, progress]);

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const commit = (nextProgress: number): void => {
    const clamped = Math.min(1, Math.max(0, nextProgress));
    const raw = min + clamped * range;
    const stepped = Math.round(raw / step) * step;
    const final = Math.min(max, Math.max(min, stepped));
    if (final !== value) onChange(final);
  };

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((event) => {
      "worklet";
      const w = width || 1;
      const next = Math.min(1, Math.max(0, event.x / w));
      progress.value = next;
      dragStart.value = next;
      runOnJS(commit)(next);
    })
    .onUpdate((event) => {
      "worklet";
      const w = width || 1;
      const next = Math.min(1, Math.max(0, event.x / w));
      progress.value = next;
      runOnJS(commit)(next);
    });

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    left: `${progress.value * 100}%`,
  }));

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.container} onLayout={onLayout}>
        <View style={[styles.track, { backgroundColor: trackColor }]} />
        <Animated.View
          style={[styles.fill, { backgroundColor: fillColor }, fillStyle]}
        />
        <Animated.View
          style={[
            styles.thumb,
            { backgroundColor: thumbColor, borderColor: palette.bg.base },
            thumbStyle,
          ]}
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 24,
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  track: {
    height: 4,
    borderRadius: radius.pill,
  },
  fill: {
    position: "absolute",
    left: 0,
    height: 4,
    borderRadius: radius.pill,
  },
  thumb: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    marginLeft: -9,
  },
});
