import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOtaUpdate } from "@/services/otaUpdates";
import {
  color,
  font,
  palette,
  radius,
  spacing,
  type as typeScale,
  zIndex,
} from "@/design/tokens";

/**
 * Floating "Update ready — tap to restart" banner. Renders nothing until an OTA
 * update has been downloaded; then pins under the status bar and applies the
 * update on tap. Mounted once at the app root.
 */
export function UpdateBanner(): React.ReactElement | null {
  const { updateReady, applyUpdate } = useOtaUpdate();
  const insets = useSafeAreaInsets();

  if (!updateReady) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { top: insets.top + spacing.sm }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Update ready — tap to restart and apply"
        onPress={() => {
          void applyUpdate();
        }}
        style={({ pressed }) => [styles.banner, pressed && styles.bannerPressed]}
      >
        <View style={styles.dot} />
        <View style={styles.textCol}>
          <Text style={styles.title}>Update ready</Text>
          <Text style={styles.subtitle}>Tap to restart and apply</Text>
        </View>
        <Text style={styles.cta}>Restart</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    zIndex: zIndex.toast,
    alignItems: "center",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    alignSelf: "stretch",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: palette.bg.elevated,
    borderWidth: 1,
    borderColor: color.amberSoft,
    shadowColor: palette.shadow,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  bannerPressed: { opacity: 0.85 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: palette.accent.gold,
  },
  textCol: { flex: 1 },
  title: {
    color: color.textPrimary,
    fontFamily: font.sansWeights.semibold,
    fontSize: typeScale.body.fontSize,
    lineHeight: typeScale.body.lineHeight,
  },
  subtitle: {
    color: color.textSecondary,
    fontFamily: font.sansWeights.regular,
    fontSize: typeScale.caption.fontSize,
    lineHeight: typeScale.caption.lineHeight,
  },
  cta: {
    color: palette.accent.gold,
    fontFamily: font.sansWeights.bold,
    fontSize: typeScale.body.fontSize,
  },
});
