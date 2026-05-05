import {
  StyleSheet,
  Text as RNText,
  type TextProps as RNTextProps,
  type TextStyle,
} from "react-native";
import { font, palette, type } from "../tokens";

export type TextVariant = keyof typeof type;
export type TextTone = "primary" | "muted" | "subtle" | "accent" | "danger" | "success";
export type TextWeight = "regular" | "medium" | "semibold" | "bold";
export type TextFamily = "sans" | "mono";

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  weight?: TextWeight;
  family?: TextFamily;
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

function resolveFontFamily(family: TextFamily, weight: TextWeight): string {
  if (family === "mono") return font.monoWeights[weight];
  return font.sansWeights[weight];
}

export function Text({
  variant = "body",
  tone = "primary",
  weight = "regular",
  family = "sans",
  align,
  style,
  ...rest
}: TextProps) {
  const variantStyle = type[variant];
  const fontFamily = resolveFontFamily(family, weight);
  const numericStyle: TextStyle | null =
    family === "mono" ? { fontVariant: ["tabular-nums"] } : null;
  return (
    <RNText
      {...rest}
      style={[
        styles.base,
        variantStyle,
        {
          color: toneColor[tone],
          fontFamily,
          textAlign: align,
        },
        numericStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { color: palette.fg.primary },
});
