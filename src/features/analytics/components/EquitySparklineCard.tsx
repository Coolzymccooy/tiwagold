import { useCallback, useMemo, useState } from "react";
import {
  type LayoutChangeEvent,
  StyleSheet,
  View,
} from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { GlassCard, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import type { EquitySparkline } from "../types";

interface EquitySparklineCardProps {
  equity: EquitySparkline;
  title: string;
  changeRLabel: string;
  changeTone: "primary" | "success" | "danger";
}

const CHART_HEIGHT = 112;
const CHART_PADDING = 6;

export function EquitySparklineCard({
  equity,
  title,
  changeRLabel,
  changeTone,
}: EquitySparklineCardProps) {
  const [width, setWidth] = useState(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  const strokeColor = resolveStroke(changeTone);
  const shape = useMemo(
    () => buildShape(equity, width),
    [equity, width],
  );

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Text variant="caption" tone="muted" weight="semibold">
          {title.toUpperCase()}
        </Text>
        <Text variant="title" weight="bold" tone={changeTone} family="mono">
          {changeRLabel}
        </Text>
      </View>
      <View style={styles.chart} onLayout={onLayout}>
        {shape && width > 0 ? (
          <Svg width={width} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={strokeColor} stopOpacity={0.28} />
                <Stop offset="1" stopColor={strokeColor} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Path d={shape.area} fill="url(#equityFill)" />
            <Path
              d={shape.line}
              stroke={strokeColor}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle
              cx={shape.latest.x}
              cy={shape.latest.y}
              r={4}
              fill={strokeColor}
              stroke={palette.bg.base}
              strokeWidth={2}
            />
          </Svg>
        ) : (
          <View style={styles.empty} />
        )}
      </View>
      <View style={styles.legend}>
        <LegendCell label="Min" value={formatEquity(equity.min)} />
        <LegendCell label="Latest" value={formatEquity(equity.latest?.equity)} />
        <LegendCell label="Max" value={formatEquity(equity.max)} align="right" />
      </View>
    </GlassCard>
  );
}

interface LegendCellProps {
  label: string;
  value: string;
  align?: "left" | "right";
}

function LegendCell({ label, value, align = "left" }: LegendCellProps) {
  return (
    <View style={align === "right" ? styles.legendCellRight : styles.legendCell}>
      <Text variant="caption" tone="subtle" weight="semibold">
        {label.toUpperCase()}
      </Text>
      <Text variant="body" weight="semibold" tone="primary" family="mono">
        {value}
      </Text>
    </View>
  );
}

interface Shape {
  line: string;
  area: string;
  latest: { x: number; y: number };
}

function buildShape(equity: EquitySparkline, width: number): Shape | null {
  const { points, min, max } = equity;
  if (points.length < 2 || width <= 0) return null;
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const usable = CHART_HEIGHT - CHART_PADDING * 2;
  const coords = points.map((point, index) => {
    const x = index * step;
    const y = CHART_PADDING + (1 - (point.equity - min) / range) * usable;
    return { x, y };
  });
  const line = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)},${c.y.toFixed(2)}`)
    .join(" ");
  const last = coords[coords.length - 1];
  const first = coords[0];
  if (!last || !first) return null;
  const area = `${line} L${last.x.toFixed(2)},${CHART_HEIGHT} L${first.x.toFixed(2)},${CHART_HEIGHT} Z`;
  return { line, area, latest: last };
}

function resolveStroke(tone: "primary" | "success" | "danger"): string {
  if (tone === "success") return palette.status.success;
  if (tone === "danger") return palette.status.danger;
  return palette.accent.gold;
}

function formatEquity(value: number | undefined): string {
  if (value === undefined || value === null) return "—";
  const rounded = Math.round(value);
  return rounded.toLocaleString("en-US");
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
  legend: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  legendCell: {
    gap: spacing.xs,
    alignItems: "flex-start",
  },
  legendCellRight: {
    gap: spacing.xs,
    alignItems: "flex-end",
  },
});
