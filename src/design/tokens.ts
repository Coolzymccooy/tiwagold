export const palette = {
  bg: {
    base: "#050607",
    elevated: "#0B0D10",
    glass: "rgba(255,255,255,0.06)",
  },
  fg: {
    primary: "#F5F6F7",
    muted: "#A1A7AF",
    subtle: "#5C646E",
  },
  accent: {
    gold: "#E9B14C",
    goldBright: "#F5C86A",
    goldDeep: "#B4842F",
  },
  status: {
    success: "#3EC28F",
    warn: "#E9B14C",
    danger: "#E5604D",
  },
  hairline: "rgba(255,255,255,0.08)",
  shadow: "rgba(0,0,0,0.45)",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const type = {
  caption: { fontSize: 11, lineHeight: 15, letterSpacing: 0.3 },
  body: { fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  title: { fontSize: 16, lineHeight: 21, letterSpacing: -0.15 },
  headline: { fontSize: 20, lineHeight: 25, letterSpacing: -0.4 },
  display: { fontSize: 28, lineHeight: 32, letterSpacing: -0.8 },
} as const;

export const font = {
  sans: "Inter_400Regular",
  mono: "JetBrainsMono_500Medium",
  sansWeights: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semibold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
  },
  monoWeights: {
    regular: "JetBrainsMono_400Regular",
    medium: "JetBrainsMono_500Medium",
    semibold: "JetBrainsMono_600SemiBold",
    bold: "JetBrainsMono_700Bold",
  },
} as const;

export type FontWeightName = keyof typeof font.sansWeights;

export const easing = {
  gentle: [0.32, 0.72, 0, 1] as const,
  snap: [0.2, 0.8, 0.2, 1] as const,
};

export const duration = {
  fast: 180,
  base: 240,
  slow: 320,
  screen: 480,
} as const;

export const glass = {
  intensity: 30,
  tint: "dark" as const,
  fill: palette.bg.glass,
  border: palette.hairline,
  radius: radius.md,
  shadowOpacity: 0.15,
};

export const zIndex = {
  base: 0,
  elevated: 10,
  overlay: 50,
  toast: 100,
} as const;

export type Palette = typeof palette;
export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type TypeScale = typeof type;
