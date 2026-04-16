import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Fingerprint } from "lucide-react-native";
import { PressableScale, Text } from "@/design/primitives";
import {
  duration,
  easing,
  palette,
  radius,
  spacing,
} from "@/design/tokens";
import { COPY } from "@/content/copy";

export interface BiometricButtonProps {
  onPress: () => void;
  isScanning?: boolean;
  disabled?: boolean;
  error?: string | null;
}

const gentleEasing = Easing.bezier(
  easing.gentle[0],
  easing.gentle[1],
  easing.gentle[2],
  easing.gentle[3],
);

export function BiometricButton({
  onPress,
  isScanning = false,
  disabled = false,
  error = null,
}: BiometricButtonProps) {
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(0);
  const scan = useSharedValue(0);
  const copy = COPY.auth.login.biometric;

  useEffect(() => {
    if (!isScanning) {
      cancelAnimation(pulse);
      cancelAnimation(scan);
      pulse.value = withTiming(0, { duration: duration.fast });
      scan.value = withTiming(0, { duration: duration.fast });
      return;
    }
    if (reducedMotion) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 140, easing: gentleEasing }),
          withTiming(0, { duration: 140, easing: gentleEasing }),
        ),
        -1,
        false,
      );
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: duration.slow, easing: gentleEasing }),
        withTiming(0, { duration: duration.slow, easing: gentleEasing }),
      ),
      -1,
      false,
    );
    scan.value = withRepeat(
      withTiming(1, { duration: duration.screen * 2, easing: gentleEasing }),
      -1,
      false,
    );
  }, [isScanning, pulse, reducedMotion, scan]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + pulse.value * 0.55,
    transform: reducedMotion
      ? [{ scale: 1 }]
      : [{ scale: 1 + pulse.value * 0.08 }],
  }));

  const scanLineStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0 : 0.5 + Math.abs(scan.value - 0.5) * 0.5,
    transform: [
      {
        translateY: reducedMotion ? 0 : -24 + scan.value * 48,
      },
    ],
  }));

  const interactive = !disabled && !isScanning;
  const label = isScanning ? copy.scanning : copy.label;

  return (
    <View style={styles.wrapper}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !interactive, busy: isScanning }}
        disabled={!interactive}
        onPress={onPress}
        style={[styles.shell, !interactive ? styles.shellDisabled : null]}
        scaleTo={0.96}
      >
        <View style={styles.iconWrap}>
          <Animated.View style={[styles.halo, haloStyle]} />
          <Animated.View style={[styles.scanLine, scanLineStyle]} />
          <Fingerprint
            size={28}
            color={interactive ? palette.accent.gold : palette.fg.subtle}
            strokeWidth={1.8}
          />
        </View>
        <Text
          variant="caption"
          tone={interactive ? "accent" : "subtle"}
          weight="semibold"
        >
          {label.toUpperCase()}
        </Text>
      </PressableScale>
      {error ? (
        <Text variant="caption" tone="danger" align="center">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const ICON_SIZE = 56;

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
    alignItems: "center",
  },
  shell: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.hairline,
    backgroundColor: palette.bg.elevated,
    minWidth: 180,
  },
  shellDisabled: {
    opacity: 0.6,
  },
  iconWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: radius.pill,
  },
  halo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.accent.gold,
    backgroundColor: "rgba(233,177,76,0.08)",
  },
  scanLine: {
    position: "absolute",
    left: spacing.sm,
    right: spacing.sm,
    height: 1,
    backgroundColor: palette.accent.goldBright,
  },
});
