import { StyleSheet, View } from "react-native";
import { ExpandableSection } from "@/components/ExpandableSection";
import { Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import { COPY } from "@/content/copy";
import type { Trade } from "@/types/trade";

export interface MarketContextSectionProps {
  trade: Trade;
  sessionLabel: string;
}

interface ContextCell {
  label: string;
  value: string;
}

const NO_VALUE = COPY.tradeDetail.placeholder.noValue;

function formatPrice(value: number | undefined): string {
  return typeof value === "number" ? value.toFixed(2) : NO_VALUE;
}

function formatSpread(value: number | undefined): string {
  return typeof value === "number" ? value.toFixed(2) : NO_VALUE;
}

function formatText(value: string | undefined): string {
  return value && value.length > 0 ? value : NO_VALUE;
}

function buildCells(trade: Trade, sessionLabel: string): ContextCell[] {
  return [
    { label: COPY.tradeDetail.fields.htfTrend, value: formatText(trade.htfTrend) },
    { label: COPY.tradeDetail.fields.ltfStructure, value: formatText(trade.ltfStructure) },
    { label: COPY.tradeDetail.fields.session, value: sessionLabel },
    { label: COPY.tradeDetail.fields.atr14, value: formatPrice(trade.atr14) },
    { label: COPY.tradeDetail.fields.spread, value: formatSpread(trade.spread) },
    { label: COPY.tradeDetail.fields.currentPrice, value: formatPrice(trade.currentPrice) },
  ];
}

export function MarketContextSection({ trade, sessionLabel }: MarketContextSectionProps) {
  const locked = typeof trade.currentPrice !== "number";
  const cells = buildCells(trade, sessionLabel);
  const hasConfluence = trade.confluenceTags.length > 0;

  return (
    <ExpandableSection
      title={COPY.tradeDetail.sections.context}
      caption={COPY.tradeDetail.sectionCaptions.context}
      locked={locked}
      lockReason={COPY.tradeDetail.lock.contextAwaiting}
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
      {hasConfluence ? (
        <View style={styles.confluenceBlock}>
          <Text variant="caption" tone="muted" weight="semibold">
            {COPY.tradeDetail.sections.confluence.toUpperCase()}
          </Text>
          <View style={styles.chipRow}>
            {trade.confluenceTags.map((tag) => (
              <View key={tag} style={styles.chip}>
                <Text variant="caption" tone="accent" weight="semibold">
                  {tag.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
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
  confluenceBlock: {
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.accent.gold,
    backgroundColor: "rgba(233,177,76,0.10)",
  },
});
