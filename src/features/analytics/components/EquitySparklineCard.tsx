import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { GlassCard, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import type { EquitySparkline } from "../types";

interface EquitySparklineCardProps {
  equity: EquitySparkline;
  title: string;
  changeRLabel: string;
  changeTone: "primary" | "success" | "danger";
}

const CHART_HEIGHT = 96;
const CHART_WIDTH = 320;

export function EquitySparklineCard({
  equity,
  title,
  changeRLabel,
  changeTone,
}: EquitySparklineCardProps) {
  const path = buildPath(equity);
  const strokeColor =
    changeTone === "success"
      ? palette.status.success
      : changeTone === "danger"
        ? palette.status.danger
        : palette.accent.gold;
  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Text variant="caption" tone="muted" weight="semibold">
          {title.toUpperCase()}
        </Text>
        <Text variant="title" weight="bold" tone={changeTone}>
          {changeRLabel}
        </Text>
      </View>
      <View style={styles.chart}>
        {path ? (
          <Svg
            width="100%"
            height={CHART_HEIGHT}
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            preserveAspectRatio="none"
          >
            <Path
              d={path}
              stroke={strokeColor}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ) : (
          <View style={styles.empty} />
        )}
      </View>
    </GlassCard>
  );
}

function buildPath(equity: EquitySparkline): string | null {
  const { points, min, max } = equity;
  if (points.length < 2) return null;
  const range = max - min || 1;
  const step = CHART_WIDTH / (points.length - 1);
  const padding = 4;
  const usableHeight = CHART_HEIGHT - padding * 2;
  const segments = points.map((point, index) => {
    const x = index * step;
    const y = padding + (1 - (point.equity - min) / range) * usableHeight;
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  });
  return segments.join(" ");
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  chart: {
    height: CHART_HEIGHT,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  empty: {
    flex: 1,
    backgroundColor: palette.bg.elevated,
    borderRadius: radius.sm,
  },
});
