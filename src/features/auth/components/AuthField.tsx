import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { Text } from "@/design/primitives";
import { palette, radius, spacing, type as typeTokens } from "@/design/tokens";
import { COPY } from "@/content/copy";

export interface AuthFieldProps extends Omit<TextInputProps, "style"> {
  label: string;
  error?: string | null;
  toggleVisibility?: boolean;
}

export function AuthField({
  label,
  error,
  toggleVisibility = false,
  secureTextEntry,
  ...rest
}: AuthFieldProps) {
  const [visible, setVisible] = useState(false);
  const isSecure = Boolean(secureTextEntry) && !(toggleVisibility && visible);
  const Icon = visible ? EyeOff : Eye;
  const iconLabel = visible
    ? COPY.auth.login.hidePassword
    : COPY.auth.login.showPassword;

  return (
    <View style={styles.row}>
      <Text variant="caption" tone="muted" weight="medium">
        {label.toUpperCase()}
      </Text>
      <View style={styles.inputShell}>
        <TextInput
          {...rest}
          secureTextEntry={isSecure}
          placeholderTextColor={palette.fg.subtle}
          style={[
            styles.input,
            toggleVisibility ? styles.inputWithAction : null,
            error ? styles.inputError : null,
          ]}
        />
        {toggleVisibility ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={iconLabel}
            onPress={() => setVisible((v) => !v)}
            hitSlop={12}
            style={({ pressed }) => [
              styles.iconButton,
              pressed ? styles.iconButtonPressed : null,
            ]}
          >
            <Icon size={18} color={palette.fg.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.xs,
  },
  inputShell: {
    marginTop: spacing.xs,
    position: "relative",
    justifyContent: "center",
  },
  input: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.hairline,
    backgroundColor: palette.bg.elevated,
    color: palette.fg.primary,
    fontSize: typeTokens.body.fontSize,
    lineHeight: typeTokens.body.lineHeight,
  },
  inputWithAction: {
    paddingRight: spacing["2xl"] + spacing.sm,
  },
  inputError: {
    borderColor: palette.status.danger,
  },
  iconButton: {
    position: "absolute",
    right: spacing.sm,
    width: spacing["2xl"],
    height: spacing["2xl"],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
  },
  iconButtonPressed: {
    backgroundColor: palette.bg.glass,
  },
});
