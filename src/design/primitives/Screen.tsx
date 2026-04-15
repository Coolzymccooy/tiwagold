import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { palette, spacing } from "../tokens";

export interface ScreenProps {
  children: ReactNode;
  edges?: readonly ("top" | "bottom" | "left" | "right")[];
  withKeyboardAvoid?: boolean;
  keyboardVerticalOffset?: number;
  padded?: boolean;
  style?: ViewStyle;
}

export function Screen({
  children,
  edges = ["top", "bottom", "left", "right"],
  withKeyboardAvoid = false,
  keyboardVerticalOffset = 0,
  padded = true,
  style,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const paddingStyle: ViewStyle = {
    paddingTop: edges.includes("top") ? insets.top : 0,
    paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
    paddingLeft: edges.includes("left") ? insets.left : 0,
    paddingRight: edges.includes("right") ? insets.right : 0,
  };

  const innerPadding: ViewStyle = padded
    ? { paddingHorizontal: spacing.lg }
    : {};

  const content = (
    <View style={[styles.inner, innerPadding, style]}>{children}</View>
  );

  return (
    <View style={[styles.root, paddingStyle]}>
      <StatusBar style="light" />
      {withKeyboardAvoid ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bg.base,
  },
  flex: { flex: 1 },
  inner: { flex: 1 },
});
