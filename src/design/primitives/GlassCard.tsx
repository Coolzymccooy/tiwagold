import type { ReactNode } from "react";
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { BlurView } from "expo-blur";
import { glass, palette, radius, spacing } from "../tokens";

export interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  intensity?: number;
  tone?: "default" | "accent";
}

export function GlassCard({
  children,
  style,
  padded = true,
  intensity = glass.intensity,
  tone = "default",
}: GlassCardProps) {
  const tintFill =
    tone === "accent" ? "rgba(233,177,76,0.10)" : glass.fill;

  return (
    <View style={[styles.shell, style]}>
      <BlurView
        intensity={intensity}
        tint={glass.tint}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.fill, { backgroundColor: tintFill }]} />
      <View style={[styles.inner, padded && styles.padded]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: palette.bg.elevated,
    shadowColor: "#000",
    shadowOpacity: glass.shadowOpacity,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  fill: { ...StyleSheet.absoluteFillObject },
  inner: { position: "relative" },
  padded: { padding: spacing.lg },
});
