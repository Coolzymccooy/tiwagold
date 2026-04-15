import { StyleSheet, View } from "react-native";
import { spacing } from "@/design/tokens";
import type { Trade } from "@/types/trade";
import { ExecutionSection } from "./ExecutionSection";
import { MarketContextSection } from "./MarketContextSection";
import { RiskSection } from "./RiskSection";
import { TradeLogicSection } from "./TradeLogicSection";

export interface TradeDetailSectionsProps {
  trade: Trade;
  engineLabel: string;
  sessionLabel: string;
}

export function TradeDetailSections({
  trade,
  engineLabel,
  sessionLabel,
}: TradeDetailSectionsProps) {
  return (
    <View style={styles.stack}>
      <MarketContextSection trade={trade} sessionLabel={sessionLabel} />
      <TradeLogicSection trade={trade} engineLabel={engineLabel} />
      <RiskSection trade={trade} />
      <ExecutionSection trade={trade} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
  },
});
