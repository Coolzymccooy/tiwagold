import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { PressableScale, Text } from "@/design/primitives";
import { duration, palette, radius, spacing } from "@/design/tokens";
import { COPY } from "@/content/copy";

export type SlideVariant = "approve" | "execute";

export interface SlideToExecuteProps {
  label: string;
  pendingLabel: string;
  onConfirm: () => void;
  variant?: SlideVariant;
  disabled?: boolean;
  pending?: boolean;
  locked?: boolean;
  lockReason?: string;
  reducedMotionLabel?: string;
}

const THUMB_SIZE = 48;
const TRACK_HEIGHT = 56;
const THRESHOLD_RATIO = 0.85;
const TIMING = { duration: duration.base, easing: Easing.bezier(0.2, 0.8, 0.2, 1) };

function selectHighlight(variant: SlideVariant): string {
  return variant === "execute" ? palette.status.success : palette.accent.gold;
}

function notifyLocked() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

function notifySelection() {
  void Haptics.selectionAsync();
}

function notifyConfirm() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function SlideToExecute(props: SlideToExecuteProps) {
  const {
    label,
    pendingLabel,
    onConfirm,
    variant = "approve",
    disabled = false,
    pending = false,
    locked = false,
    lockReason,
    reducedMotionLabel,
  } = props;

  const reducedMotion = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const offset = useSharedValue(0);
  const interactionDisabled = disabled || pending || locked;
  const highlight = selectHighlight(variant);

  const onTrackLayout = useCallback((event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  }, []);

  const handleConfirm = useCallback(() => {
    notifyConfirm();
    onConfirm();
  }, [onConfirm]);

  const handleLocked = useCallback(() => {
    notifyLocked();
  }, []);

  const maxOffset = Math.max(0, trackWidth - THUMB_SIZE - spacing.xs * 2);
  const threshold = maxOffset * THRESHOLD_RATIO;

  const pan = Gesture.Pan()
    .enabled(!interactionDisabled && !reducedMotion && trackWidth > 0)
    .activeOffsetX([-8, 8])
    .onBegin(() => {
      runOnJS(notifySelection)();
    })
    .onUpdate((event) => {
      const next = Math.min(Math.max(0, event.translationX), maxOffset);
      offset.value = next;
    })
    .onEnd(() => {
      if (offset.value >= threshold && threshold > 0) {
        offset.value = withTiming(maxOffset, TIMING);
        runOnJS(handleConfirm)();
      } else {
        offset.value = withTiming(0, TIMING);
      }
    })
    .onFinalize(() => {
      if (offset.value < threshold) {
        offset.value = withTiming(0, TIMING);
      }
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  const fillStyle = useAnimatedStyle(() => {
    const opacity = maxOffset === 0 ? 0 : Math.min(1, offset.value / maxOffset + 0.15);
    return {
      opacity,
      width: offset.value + THUMB_SIZE + spacing.xs,
    };
  });

  if (reducedMotion) {
    return (
      <ReducedMotionButton
        label={reducedMotionLabel ?? label}
        pendingLabel={pendingLabel}
        onPress={interactionDisabled ? handleLocked : handleConfirm}
        disabled={interactionDisabled}
        pending={pending}
        locked={locked}
        lockReason={lockReason}
        highlight={highlight}
      />
    );
  }

  const displayLabel = pending
    ? pendingLabel
    : locked
      ? (lockReason ?? COPY.tradeDetail.slideToExecute.locked)
      : label;

  return (
    <GestureDetector gesture={pan}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityState={{ disabled: interactionDisabled, busy: pending }}
        accessibilityLabel={displayLabel}
        accessibilityHint={COPY.tradeDetail.slideToExecute.hint}
        onLayout={onTrackLayout}
        style={[
          styles.track,
          { borderColor: interactionDisabled ? palette.hairline : highlight },
          interactionDisabled ? styles.trackDisabled : null,
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.fill, { backgroundColor: highlight }, fillStyle]}
        />
        <View style={styles.labelWrap} pointerEvents="none">
          {pending ? (
            <ActivityIndicator color={highlight} size="small" />
          ) : null}
          <Text
            variant="body"
            weight="semibold"
            tone={interactionDisabled ? "muted" : "primary"}
            align="center"
          >
            {displayLabel}
          </Text>
        </View>
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: interactionDisabled ? palette.fg.subtle : highlight,
            },
            thumbStyle,
          ]}
          pointerEvents="none"
        >
          <Text variant="title" weight="bold" tone="primary" align="center">
            ›
          </Text>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

interface ReducedMotionButtonProps {
  label: string;
  pendingLabel: string;
  onPress: () => void;
  disabled: boolean;
  pending: boolean;
  locked: boolean;
  lockReason?: string;
  highlight: string;
}

function ReducedMotionButton(props: ReducedMotionButtonProps) {
  const {
    label,
    pendingLabel,
    onPress,
    disabled,
    pending,
    locked,
    lockReason,
    highlight,
  } = props;
  const displayLabel = pending
    ? pendingLabel
    : locked
      ? (lockReason ?? COPY.tradeDetail.slideToExecute.locked)
      : label;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: pending }}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.reducedBtn,
        {
          backgroundColor: disabled ? palette.bg.elevated : highlight,
          borderColor: disabled ? palette.hairline : highlight,
        },
      ]}
    >
      <View style={styles.labelWrap}>
        {pending ? <ActivityIndicator color={palette.fg.primary} size="small" /> : null}
        <Text
          variant="title"
          weight="semibold"
          tone={disabled ? "muted" : "primary"}
          align="center"
        >
          {displayLabel}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  track: {
    height: TRACK_HEIGHT,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: palette.bg.elevated,
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: spacing.xs,
  },
  trackDisabled: {
    opacity: 0.7,
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: radius.pill,
    borderBottomLeftRadius: radius.pill,
  },
  labelWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  thumb: {
    position: "absolute",
    left: spacing.xs,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: palette.shadow,
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  reducedBtn: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
});
