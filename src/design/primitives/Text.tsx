import {
  StyleSheet,
  Text as RNText,
  type TextProps as RNTextProps,
  type TextStyle,
} from "react-native";
import { palette, type } from "../tokens";

export type TextVariant = keyof typeof type;
export type TextTone = "primary" | "muted" | "subtle" | "accent" | "danger" | "success";

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  weight?: "regular" | "medium" | "semibold" | "bold";
  align?: TextStyle["textAlign"];
}

const toneColor: Record<TextTone, string> = {
  primary: palette.fg.primary,
  muted: palette.fg.muted,
  subtle: palette.fg.subtle,
  accent: palette.accent.gold,
  danger: palette.status.danger,
  success: palette.status.success,
};

const weightMap: Record<NonNullable<TextProps["weight"]>, TextStyle["fontWeight"]> = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
};

export function Text({
  variant = "body",
  tone = "primary",
  weight = "regular",
  align,
  style,
  ...rest
}: TextProps) {
  const variantStyle = type[variant];
  return (
    <RNText
      {...rest}
      style={[
        styles.base,
        variantStyle,
        {
          color: toneColor[tone],
          fontWeight: weightMap[weight],
          textAlign: align,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { color: palette.fg.primary },
});
