import { StyleSheet, View } from "react-native";
import { GlassCard, Text } from "@/design/primitives";
import { spacing } from "@/design/tokens";
import type { AnalyticsKpi } from "../types";

interface KpiGridProps {
  kpis: AnalyticsKpi[];
}

export function KpiGrid({ kpis }: KpiGridProps) {
  return (
    <View style={styles.grid}>
      {kpis.map((kpi) => (
        <KpiTile key={kpi.id} kpi={kpi} />
      ))}
    </View>
  );
}

interface KpiTileProps {
  kpi: AnalyticsKpi;
}

function KpiTile({ kpi }: KpiTileProps) {
  const tone =
    kpi.tone === "positive"
      ? "success"
      : kpi.tone === "negative"
        ? "danger"
        : "primary";
  const isHero = kpi.emphasis === "hero";
  return (
    <GlassCard
      padded={false}
      style={[styles.tileShell, isHero ? styles.heroTile : styles.tile]}
    >
      <Text variant="caption" tone="muted" weight="semibold">
        {kpi.label.toUpperCase()}
      </Text>
      <Text
        variant={isHero ? "headline" : "title"}
        weight="bold"
        tone={tone}
        family="mono"
      >
        {kpi.value}
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tileShell: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  tile: {
    flexBasis: "47%",
    flexGrow: 1,
  },
  heroTile: {
    flexBasis: "100%",
    flexGrow: 1,
  },
});
