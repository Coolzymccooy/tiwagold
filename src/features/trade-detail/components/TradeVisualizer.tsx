import { StyleSheet, View } from "react-native";
import { Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import type { Trade } from "@/types/trade";

export interface TradeVisualizerProps {
  trade: Trade;
}

interface Marker {
  key: string;
  label: string;
  price: number;
  color: string;
  emphasis: "primary" | "secondary";
}

const MARKER_WIDTH = 60;

function priceLabel(value: number): string {
  return value.toFixed(2);
}

function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function resolveRange(points: readonly number[]): { min: number; max: number } {
  const rawMin = Math.min(...points);
  const rawMax = Math.max(...points);
  const span = rawMax - rawMin;
  const pad = span === 0 ? Math.max(Math.abs(rawMax), 1) * 0.02 : span * 0.12;
  return { min: rawMin - pad, max: rawMax + pad };
}

export function TradeVisualizer({ trade }: TradeVisualizerProps) {
  const {
    direction,
    proposedEntry,
    stopLoss,
    tp1,
    tp2,
    currentPrice,
    actualEntry,
    riskReward,
  } = trade;
  const entry = typeof actualEntry === "number" ? actualEntry : proposedEntry;
  const isBuy = direction === "BUY";

  const prices: number[] = [stopLoss, entry, tp1];
  if (typeof tp2 === "number") prices.push(tp2);
  if (typeof currentPrice === "number") prices.push(currentPrice);

  const { min, max } = resolveRange(prices);
  const range = max - min || 1;
  const ratio = (value: number): number => clampRatio((value - min) / range);

  const entryRatio = ratio(entry);
  const stopRatio = ratio(stopLoss);
  const tp1Ratio = ratio(tp1);
  const tp2Ratio = typeof tp2 === "number" ? ratio(tp2) : null;
  const currentRatio =
    typeof currentPrice === "number" ? ratio(currentPrice) : null;

  const tpFarRatio =
    tp2Ratio === null
      ? tp1Ratio
      : isBuy
        ? Math.max(tp1Ratio, tp2Ratio)
        : Math.min(tp1Ratio, tp2Ratio);

  const lossStart = isBuy ? stopRatio : entryRatio;
  const lossEnd = isBuy ? entryRatio : stopRatio;
  const profitStart = isBuy ? entryRatio : tpFarRatio;
  const profitEnd = isBuy ? tpFarRatio : entryRatio;

  const markers: Marker[] = [
    {
      key: "sl",
      label: "SL",
      price: stopLoss,
      color: palette.status.danger,
      emphasis: "secondary",
    },
    {
      key: "entry",
      label: "ENTRY",
      price: entry,
      color: palette.accent.gold,
      emphasis: "primary",
    },
    {
      key: "tp1",
      label: "TP1",
      price: tp1,
      color: palette.status.success,
      emphasis: "secondary",
    },
  ];
  if (typeof tp2 === "number") {
    markers.push({
      key: "tp2",
      label: "TP2",
      price: tp2,
      color: palette.status.success,
      emphasis: "secondary",
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.legend}>
        <Text variant="caption" tone="muted" weight="medium">
          {isBuy ? "LONG" : "SHORT"} · {riskReward.toFixed(2)}R TARGET
        </Text>
        {typeof currentPrice === "number" ? (
          <Text variant="caption" tone="accent" weight="semibold">
            LIVE {priceLabel(currentPrice)}
          </Text>
        ) : null}
      </View>

      <View style={styles.railRow}>
        <View style={styles.track}>
          <View
            style={[
              styles.segment,
              styles.lossSegment,
              {
                left: `${lossStart * 100}%`,
                width: `${Math.max(0, (lossEnd - lossStart) * 100)}%`,
              },
            ]}
          />
          <View
            style={[
              styles.segment,
              styles.profitSegment,
              {
                left: `${profitStart * 100}%`,
                width: `${Math.max(0, (profitEnd - profitStart) * 100)}%`,
              },
            ]}
          />
          {currentRatio !== null ? (
            <View
              style={[styles.currentDot, { left: `${currentRatio * 100}%` }]}
            />
          ) : null}
        </View>
      </View>

      <View style={styles.markerRow}>
        {markers.map((marker) => (
          <MarkerColumn
            key={marker.key}
            marker={marker}
            ratio={ratio(marker.price)}
          />
        ))}
      </View>
    </View>
  );
}

interface MarkerColumnProps {
  marker: Marker;
  ratio: number;
}

function MarkerColumn({ marker, ratio }: MarkerColumnProps) {
  const tickOpacity = marker.emphasis === "primary" ? 1 : 0.85;
  return (
    <View style={[styles.marker, { left: `${ratio * 100}%` }]}>
      <View
        style={[
          styles.markerTick,
          { backgroundColor: marker.color, opacity: tickOpacity },
        ]}
      />
      <Text variant="caption" tone="subtle" weight="medium" align="center">
        {marker.label}
      </Text>
      <Text
        variant="caption"
        weight={marker.emphasis === "primary" ? "bold" : "semibold"}
        align="center"
      >
        {priceLabel(marker.price)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  railRow: {
    paddingVertical: spacing.lg,
  },
  track: {
    position: "relative",
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: palette.hairline,
  },
  segment: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderRadius: radius.pill,
  },
  lossSegment: {
    backgroundColor: "rgba(229,96,77,0.35)",
  },
  profitSegment: {
    backgroundColor: "rgba(62,194,143,0.35)",
  },
  currentDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: radius.pill,
    top: -3,
    marginLeft: -6,
    backgroundColor: palette.accent.goldBright,
    borderWidth: 2,
    borderColor: palette.bg.base,
    shadowColor: palette.accent.gold,
    shadowOpacity: 0.65,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  markerRow: {
    position: "relative",
    height: 48,
  },
  marker: {
    position: "absolute",
    width: MARKER_WIDTH,
    marginLeft: -MARKER_WIDTH / 2,
    alignItems: "center",
    gap: 2,
  },
  markerTick: {
    width: 2,
    height: 10,
    borderRadius: radius.pill,
    marginBottom: spacing.xs,
  },
});
