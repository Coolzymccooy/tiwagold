import { StyleSheet, View } from "react-native";
import { ExpandableSection } from "@/components/ExpandableSection";
import { Text } from "@/design/primitives";
import { spacing } from "@/design/tokens";
import { COPY } from "@/content/copy";
import type { Trade } from "@/types/trade";
import {
  riskRewardMultiple,
  stopDistance,
  tp1Distance,
  tp2Distance,
} from "../selectors";

export interface RiskSectionProps {
  trade: Trade;
}

interface RiskCell {
  label: string;
  value: string;
}

const NO_VALUE = COPY.tradeDetail.placeholder.noValue;

function formatDistance(value: number | undefined): string {
  return typeof value === "number" ? value.toFixed(2) : NO_VALUE;
}

function formatMultiple(value: number): string {
  return `${value.toFixed(2)}R`;
}

function buildCells(trade: Trade): RiskCell[] {
  const cells: RiskCell[] = [
    {
      label: COPY.tradeDetail.fields.stopDistance,
      value: formatDistance(stopDistance(trade)),
    },
    {
      label: COPY.tradeDetail.fields.tp1Distance,
      value: formatDistance(tp1Distance(trade)),
    },
  ];
  const tp2 = tp2Distance(trade);
  if (typeof tp2 === "number") {
    cells.push({
      label: COPY.tradeDetail.fields.tp2Distance,
      value: formatDistance(tp2),
    });
  }
  cells.push({
    label: COPY.tradeDetail.fields.rr,
    value: formatMultiple(riskRewardMultiple(trade)),
  });
  return cells;
}

export function RiskSection({ trade }: RiskSectionProps) {
  const cells = buildCells(trade);

  return (
    <ExpandableSection
      title={COPY.tradeDetail.sections.risk}
      caption={COPY.tradeDetail.sectionCaptions.risk}
    >
      <View style={styles.grid}>
        {cells.map((cell) => (
          <View key={cell.label} style={styles.cell}>
            <Text variant="caption" tone="subtle">
              {cell.label}
            </Text>
            <Text variant="title" weight="semibold">
              {cell.value}
            </Text>
          </View>
        ))}
      </View>
    </ExpandableSection>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  cell: {
    flexBasis: "30%",
    flexGrow: 1,
    gap: spacing.xs,
  },
});
