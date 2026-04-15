import { ActivityIndicator, StyleSheet, View } from "react-native";
import { PressableScale, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";

interface SignOutButtonProps {
  label: string;
  onPress: () => void;
  isSigningOut: boolean;
}

export function SignOutButton({ label, onPress, isSigningOut }: SignOutButtonProps) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={isSigningOut}
      style={styles.button}
    >
      <View style={styles.content}>
        {isSigningOut ? (
          <ActivityIndicator color={palette.status.danger} />
        ) : (
          <Text variant="body" weight="semibold" tone="danger">
            {label}
          </Text>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.status.danger,
    backgroundColor: "transparent",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
});
