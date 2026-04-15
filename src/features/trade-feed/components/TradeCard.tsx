import { StyleSheet, View } from "react-native";
import { GlassCard, PressableScale, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import type { SessionName } from "@/types/trade";
import type { TradeFeedItem } from "../types";

export interface TradeCardProps {
  item: TradeFeedItem;
  onPress: (tradeId: string) => void;
}

type StatusKind = "active" | "pending" | "closed";

const SESSION_LABEL: Record<SessionName, string> = {
  london: "London",
  new_york: "New York",
  asian: "Asian",
  off_hours: "Off hours",
};

const SESSION_COLOR: Record<SessionName, string> = {
  london: palette.accent.gold,
  new_york: palette.status.success,
  asian: palette.fg.muted,
  off_hours: palette.fg.subtle,
};

const STATUS_COLOR: Record<StatusKind, string> = {
  active: palette.status.success,
  pending: palette.accent.gold,
  closed: palette.fg.subtle,
};

const STATUS_LABEL: Record<StatusKind, string> = {
  active: "Open",
  pending: "Pending",
  closed: "Closed",
};

const ENGINE_LABEL: Record<TradeFeedItem["engineTier"], string> = {
  conservative: "Conservative",
  aggressive: "Aggressive",
  sniper: "Sniper",
};

function humanizeSetupType(value: string): string {
  if (!value) return value;
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part, index) =>
      index === 0
        ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        : part.toLowerCase(),
    )
    .join(" ");
}

function resolveStatus(item: TradeFeedItem): StatusKind {
  if (item.isActive) return "active";
  if (item.isPending) return "pending";
  return "closed";
}

export function TradeCard({ item, onPress }: TradeCardProps) {
  const { trade, directionLabel, engineTier, pnlRLabel } = item;
  const isBuy = directionLabel === "BUY";
  const directionColor = isBuy ? palette.status.success : palette.status.danger;
  const directionTone = isBuy ? "success" : "danger";
  const status = resolveStatus(item);
  const scorePercent = Math.max(0, Math.min(100, trade.score));

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${trade.symbol} ${directionLabel} setup, ${STATUS_LABEL[status]}`}
      onPress={() => onPress(trade.id)}
    >
      <GlassCard
        style={[styles.card, { borderLeftWidth: 3, borderLeftColor: directionColor }]}
      >
        <View style={styles.row}>
          <View style={styles.headline}>
            <View style={styles.meta}>
              <Text variant="caption" tone="muted" weight="medium" numberOfLines={1}>
                {trade.symbol.toUpperCase()} · {ENGINE_LABEL[engineTier].toUpperCase()}
              </Text>
              <StatusDot kind={status} />
              <Text variant="caption" tone="subtle" weight="medium">
                {STATUS_LABEL[status].toUpperCase()}
              </Text>
            </View>
            <Text variant="title" weight="semibold" numberOfLines={1}>
              {humanizeSetupType(trade.setupType)}
            </Text>
          </View>
          <View
            style={[
              styles.directionPill,
              isBuy ? styles.buyPill : styles.sellPill,
            ]}
          >
            <Text variant="caption" tone={directionTone} weight="bold">
              {directionLabel}
            </Text>
          </View>
        </View>

        <View style={styles.metrics}>
          <Metric label="Entry" value={trade.proposedEntry.toFixed(2)} />
          <Metric label="Stop" value={trade.stopLoss.toFixed(2)} />
          <Metric label="TP1" value={trade.tp1.toFixed(2)} />
          <Metric label="R:R" value={trade.riskReward.toFixed(2)} />
        </View>

        <ScoreBar value={scorePercent} />

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <SessionBadge session={trade.sessionTag} />
            <Text variant="caption" tone="muted">
              score {trade.score}
            </Text>
          </View>
          {pnlRLabel ? (
            <Text
              variant="body"
              tone={pnlRLabel.startsWith("-") ? "danger" : "success"}
              weight="bold"
            >
              {pnlRLabel}
            </Text>
          ) : null}
        </View>
      </GlassCard>
    </PressableScale>
  );
}

interface MetricProps {
  label: string;
  value: string;
}

function Metric({ label, value }: MetricProps) {
  return (
    <View style={styles.metric}>
      <Text variant="caption" tone="subtle">
        {label}
      </Text>
      <Text variant="body" weight="semibold">
        {value}
      </Text>
    </View>
  );
}

interface StatusDotProps {
  kind: StatusKind;
}

function StatusDot({ kind }: StatusDotProps) {
  return <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[kind] }]} />;
}

interface SessionBadgeProps {
  session: SessionName;
}

function SessionBadge({ session }: SessionBadgeProps) {
  const color = SESSION_COLOR[session];
  return (
    <View style={[styles.sessionBadge, { borderColor: color }]}>
      <View style={[styles.sessionDot, { backgroundColor: color }]} />
      <Text variant="caption" tone="muted" weight="medium">
        {SESSION_LABEL[session]}
      </Text>
    </View>
  );
}

interface ScoreBarProps {
  value: number;
}

function ScoreBar({ value }: ScoreBarProps) {
  return (
    <View style={styles.scoreTrack}>
      <View style={[styles.scoreFill, { width: `${value}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headline: {
    gap: spacing.xs,
    flex: 1,
    paddingRight: spacing.sm,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    marginHorizontal: spacing.xs,
  },
  directionPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  buyPill: {
    borderColor: palette.status.success,
    backgroundColor: "rgba(62,194,143,0.10)",
  },
  sellPill: {
    borderColor: palette.status.danger,
    backgroundColor: "rgba(229,96,77,0.10)",
  },
  metrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  metric: {
    gap: spacing.xs,
    flex: 1,
  },
  scoreTrack: {
    height: 3,
    backgroundColor: palette.hairline,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  scoreFill: {
    height: "100%",
    backgroundColor: palette.accent.gold,
    borderRadius: radius.pill,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sessionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  sessionDot: {
    width: 5,
    height: 5,
    borderRadius: radius.pill,
  },
});
