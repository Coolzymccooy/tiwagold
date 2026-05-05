import { StyleSheet, View } from "react-native";
import { ExpandableSection } from "@/components/ExpandableSection";
import { Text } from "@/design/primitives";
import { spacing } from "@/design/tokens";
import { COPY } from "@/content/copy";
import { humanizeSnake } from "@/utils/text";
import type { Trade } from "@/types/trade";

export interface TradeLogicSectionProps {
  trade: Trade;
  engineLabel: string;
}

interface LogicCell {
  label: string;
  value: string;
}

const NO_VALUE = COPY.tradeDetail.placeholder.noValue;

function formatText(value: string | undefined | null): string {
  return typeof value === "string" && value.length > 0 ? value : NO_VALUE;
}

function formatHumanText(value: string | undefined | null): string {
  if (typeof value !== "string" || value.length === 0) return NO_VALUE;
  return humanizeSnake(value);
}

function formatMode(mode: Trade["mode"]): string {
  return mode === "conservative" ? "Conservative" : "Aggressive";
}

function buildCells(trade: Trade, engineLabel: string): LogicCell[] {
  return [
    { label: COPY.tradeDetail.fields.strategyTag, value: formatHumanText(trade.strategyTag) },
    { label: COPY.tradeDetail.fields.setupType, value: formatHumanText(trade.setupType) },
    { label: COPY.tradeDetail.fields.engine, value: engineLabel },
    { label: COPY.tradeDetail.fields.score, value: `${trade.score}` },
    { label: COPY.tradeDetail.fields.mode, value: formatMode(trade.mode) },
  ];
}

export function TradeLogicSection({ trade, engineLabel }: TradeLogicSectionProps) {
  const cells = buildCells(trade, engineLabel);
  const thesis = formatText(trade.thesisSummary);

  return (
    <ExpandableSection
      title={COPY.tradeDetail.sections.logic}
      caption={COPY.tradeDetail.sectionCaptions.logic}
    >
      <View style={styles.grid}>
        {cells.map((cell) => (
          <View key={cell.label} style={styles.cell}>
            <Text variant="caption" tone="subtle">
              {cell.label}
            </Text>
            <Text variant="body" weight="semibold">
              {cell.value}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.thesisBlock}>
        <Text variant="caption" tone="muted" weight="semibold">
          {COPY.tradeDetail.sections.thesis.toUpperCase()}
        </Text>
        <Text variant="body" tone={thesis === NO_VALUE ? "muted" : "primary"}>
          {thesis}
        </Text>
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
    flexBasis: "47%",
    flexGrow: 1,
    gap: spacing.xs,
  },
  thesisBlock: {
    gap: spacing.sm,
  },
});
