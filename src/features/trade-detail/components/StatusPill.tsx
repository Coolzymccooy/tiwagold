import { StyleSheet, View, type ViewStyle } from "react-native";
import { Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import type { Trade } from "@/types/trade";

export interface StatusPillProps {
  status: Trade["status"];
  label: string;
}

const STATUS_STYLES: Record<Trade["status"], { border: string; fill: string; tone: "success" | "muted" | "danger" | "accent" }> = {
  created: {
    border: palette.accent.gold,
    fill: "rgba(233,177,76,0.10)",
    tone: "accent",
  },
  approved: {
    border: palette.status.success,
    fill: "rgba(62,194,143,0.10)",
    tone: "success",
  },
  executed: {
    border: palette.status.success,
    fill: "rgba(62,194,143,0.10)",
    tone: "success",
  },
  risk_blocked: {
    border: palette.status.danger,
    fill: "rgba(229,96,77,0.10)",
    tone: "danger",
  },
  expired: {
    border: palette.fg.subtle,
    fill: "rgba(255,255,255,0.04)",
    tone: "muted",
  },
  cancelled: {
    border: palette.fg.subtle,
    fill: "rgba(255,255,255,0.04)",
    tone: "muted",
  },
};

export function StatusPill({ status, label }: StatusPillProps) {
  const style = STATUS_STYLES[status];
  const pillStyle: ViewStyle = {
    borderColor: style.border,
    backgroundColor: style.fill,
  };

  return (
    <View style={[styles.pill, pillStyle]}>
      <Text variant="caption" tone={style.tone} weight="semibold">
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
});
