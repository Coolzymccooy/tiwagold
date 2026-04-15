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
  return (
    <GlassCard style={styles.tile}>
      <Text variant="caption" tone="muted" weight="semibold">
        {kpi.label.toUpperCase()}
      </Text>
      <Text variant="headline" weight="bold" tone={tone}>
        {kpi.value}
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  tile: {
    flexBasis: "47%",
    flexGrow: 1,
    gap: spacing.xs,
  },
});
