import { duration, easing, font, glass, palette, radius, spacing, type } from "./tokens";

export const theme = {
  mode: "dark" as const,
  palette,
  spacing,
  radius,
  type,
  font,
  easing,
  duration,
  glass,
};

export type Theme = typeof theme;
