import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { Text } from "@/design/primitives";
import { palette, radius, spacing, type as typeTokens } from "@/design/tokens";

export interface AuthFieldProps extends Omit<TextInputProps, "style"> {
  label: string;
  error?: string | null;
}

export function AuthField({ label, error, ...rest }: AuthFieldProps) {
  return (
    <View style={styles.row}>
      <Text variant="caption" tone="muted" weight="medium">
        {label.toUpperCase()}
      </Text>
      <TextInput
        {...rest}
        placeholderTextColor={palette.fg.subtle}
        style={[styles.input, error ? styles.inputError : null]}
      />
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
  input: {
    marginTop: spacing.xs,
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
  inputError: {
    borderColor: palette.status.danger,
  },
});
