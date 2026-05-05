import { StyleSheet, View } from "react-native";
import { Globe, ShieldCheck, TrendingDown, TrendingUp, Zap } from "lucide-react-native";
import { GlassCard, PressableScale, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import { humanizeSnake } from "@/utils/text";
import type { TradeFeedItem } from "../types";

export interface TradeCardProps {
  item: TradeFeedItem;
  onPress: (tradeId: string) => void;
  onApprove?: (tradeId: string) => void;
  onReject?: (tradeId: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
}

const STATUS_DOT_COLOR: Record<TradeFeedItem["status"], string> = {
  open: palette.status.success,
  pending: palette.accent.gold,
  closed: palette.fg.subtle,
};

const PNL_TONE: Record<TradeFeedItem["pnlTone"], "success" | "danger" | "muted"> = {
  positive: "success",
  negative: "danger",
  neutral: "muted",
};

export function TradeCard({
  item,
  onPress,
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
}: TradeCardProps) {
  const { trade, directionLabel, status, statusLabel } = item;
  const isBuy = directionLabel === "BUY";
  const directionColor = isBuy ? palette.status.success : palette.status.danger;
  const DirectionIcon = isBuy ? TrendingUp : TrendingDown;

  const showApproveActions = status === "pending" && Boolean(onApprove && onReject);
  const cardTone = item.pnlTone === "positive"
    ? "rgba(62,194,143,0.06)"
    : item.pnlTone === "negative"
      ? "rgba(229,96,77,0.06)"
      : "transparent";

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${trade.symbol} ${directionLabel} setup, ${statusLabel}, ${humanizeSnake(trade.setupType)}`}
      onPress={() => onPress(trade.id)}
    >
      <GlassCard
        style={[styles.card, { backgroundColor: cardTone }]}
      >
        <View style={styles.headerRow}>
          <View style={[styles.directionIcon, { backgroundColor: `${directionColor}22`, borderColor: directionColor }]}>
            <DirectionIcon size={20} color={directionColor} />
          </View>
          <View style={styles.headline}>
            <Text variant="title" weight="bold" numberOfLines={1}>
              {trade.symbol.toUpperCase()}
            </Text>
            <View style={styles.scoreRow}>
              <View style={[styles.engineDot, { backgroundColor: palette.accent.gold }]} />
              <Text variant="caption" tone="muted" weight="medium">
                {item.engineLabel}
              </Text>
              <Text variant="caption" tone="subtle">
                {"·"}
              </Text>
              <Text
                variant="caption"
                tone="accent"
                weight="semibold"
                family="mono"
              >
                {item.scoreLabel}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {item.pnlUsdLabel ? (
              <Text
                variant="title"
                weight="bold"
                family="mono"
                tone={PNL_TONE[item.pnlTone]}
              >
                {item.pnlUsdLabel}
              </Text>
            ) : item.expectedRLabel ? (
              <Text
                variant="title"
                weight="bold"
                family="mono"
                tone="accent"
              >
                {item.expectedRLabel}
              </Text>
            ) : null}
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: STATUS_DOT_COLOR[status] },
                ]}
              />
              <Text variant="caption" tone="muted" weight="semibold">
                {statusLabel}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.chipRow}>
          <Chip icon={<Globe size={11} color={palette.fg.muted} />} label={item.sessionShortLabel} />
          <Chip icon={<ShieldCheck size={11} color={palette.fg.muted} />} label={item.riskLabel} />
          <Chip icon={<Zap size={11} color={palette.fg.muted} />} label={item.routingLabel} />
        </View>

        <View style={styles.priceRow}>
          <View style={styles.priceCell}>
            <Text variant="caption" tone="subtle" weight="medium">
              ENTRY
            </Text>
            <Text variant="body" weight="bold" family="mono">
              {item.entryLabel}
            </Text>
          </View>
          <View style={styles.priceCell}>
            <Text variant="caption" tone="subtle" weight="medium">
              CURRENT
            </Text>
            <Text variant="body" weight="bold" family="mono">
              {item.currentLabel}
            </Text>
          </View>
        </View>

        {showApproveActions ? (
          <View style={styles.actionsRow}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Reject setup"
              accessibilityState={{ disabled: isRejecting || isApproving }}
              onPress={() => onReject?.(trade.id)}
              disabled={isRejecting || isApproving}
              style={[styles.actionBtn, styles.actionRejectBtn]}
            >
              <Text variant="body" weight="semibold" tone="danger">
                {isRejecting ? "Rejecting…" : "× Reject"}
              </Text>
            </PressableScale>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Approve setup"
              accessibilityState={{ disabled: isRejecting || isApproving }}
              onPress={() => onApprove?.(trade.id)}
              disabled={isRejecting || isApproving}
              style={[styles.actionBtn, styles.actionApproveBtn]}
            >
              <Text variant="body" weight="bold" tone="primary" align="center">
                {isApproving ? "Approving…" : "✓ Approve"}
              </Text>
            </PressableScale>
          </View>
        ) : null}
      </GlassCard>
    </PressableScale>
  );
}

interface ChipProps {
  icon?: React.ReactNode;
  label: string;
}

function Chip({ icon, label }: ChipProps) {
  return (
    <View style={styles.chip}>
      {icon}
      <Text variant="caption" tone="muted" weight="semibold">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  directionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headline: {
    flex: 1,
    gap: 2,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  engineDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.hairline,
    backgroundColor: palette.bg.elevated,
  },
  priceRow: {
    flexDirection: "row",
    gap: spacing.lg,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.hairline,
  },
  priceCell: {
    flex: 1,
    gap: 2,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  actionRejectBtn: {
    borderWidth: 1,
    borderColor: palette.status.danger,
    backgroundColor: "rgba(229,96,77,0.10)",
  },
  actionApproveBtn: {
    backgroundColor: palette.accent.gold,
  },
});
