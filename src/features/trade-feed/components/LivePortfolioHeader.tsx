import { StyleSheet, View } from "react-native";
import { TrendingUp } from "lucide-react-native";
import { Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";

export interface LivePortfolioHeaderProps {
  equityLabel: string;
  pnlLabel: string | null;
  pnlTone: "positive" | "negative" | "neutral";
}

export function LivePortfolioHeader({
  equityLabel,
  pnlLabel,
  pnlTone,
}: LivePortfolioHeaderProps) {
  const tone =
    pnlTone === "positive"
      ? palette.status.success
      : pnlTone === "negative"
        ? palette.status.danger
        : palette.fg.muted;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text variant="caption" tone="muted" weight="medium">
          Live Portfolio
        </Text>
        {pnlLabel ? (
          <View
            style={[
              styles.pnlPill,
              {
                borderColor: tone,
                backgroundColor: `${tone}1F`,
              },
            ]}
          >
            <TrendingUp size={11} color={tone} />
            <Text
              variant="caption"
              weight="bold"
              family="mono"
              style={{ color: tone }}
            >
              {pnlLabel}
            </Text>
          </View>
        ) : null}
      </View>
      <Text variant="display" weight="bold" family="mono">
        {equityLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pnlPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
