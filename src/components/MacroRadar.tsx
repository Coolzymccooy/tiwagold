import { useCallback, useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { GlassCard, PressableScale, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import { COPY } from "@/content/copy";
import { useMacroEvents } from "@/services/macro";
import type { MacroImpact, MacroRadarEvent } from "@/types/macro";

export interface MacroRadarProps {
  onPressEvent?: (eventId: string) => void;
  now?: Date;
}

type RadarItem = {
  event: MacroRadarEvent;
  when: "past" | "now" | "future";
  relative: string;
};

const IMPACT_COLOR: Record<MacroImpact, string> = {
  low: palette.fg.subtle,
  medium: palette.accent.gold,
  high: palette.status.danger,
};

const BIAS_TONE: Record<MacroRadarEvent["goldBias"], "success" | "danger" | "muted"> = {
  bullish: "success",
  bearish: "danger",
  neutral: "muted",
};

export function MacroRadar({ onPressEvent, now }: MacroRadarProps) {
  const query = useMacroEvents();
  const anchor = useMemo(() => (now ? now.getTime() : Date.now()), [now]);

  const items = useMemo<RadarItem[]>(() => {
    if (!query.data) return [];
    return [...query.data]
      .map((event) => buildRadarItem(event, anchor))
      .sort((a, b) => Math.abs(timeDelta(a, anchor)) - Math.abs(timeDelta(b, anchor)))
      .slice(0, 6);
  }, [query.data, anchor]);

  const handleRetry = useCallback(() => {
    query.refetch();
  }, [query]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text variant="title" weight="semibold">
          {COPY.macroRadar.title}
        </Text>
        <Text variant="caption" tone="muted">
          {COPY.macroRadar.subtitle}
        </Text>
      </View>

      {query.isLoading ? (
        <GlassCard style={styles.stateCard}>
          <ActivityIndicator color={palette.accent.gold} />
          <Text variant="caption" tone="muted">
            {COPY.macroRadar.loading}
          </Text>
        </GlassCard>
      ) : query.isError ? (
        <GlassCard style={styles.stateCard}>
          <Text variant="body" weight="semibold" tone="danger">
            {COPY.macroRadar.error.title}
          </Text>
          <Text variant="caption" tone="muted">
            {COPY.macroRadar.error.body}
          </Text>
          <PressableScale
            accessibilityRole="button"
            onPress={handleRetry}
            style={styles.retryButton}
          >
            <Text variant="caption" weight="semibold" tone="accent">
              {COPY.macroRadar.error.retry}
            </Text>
          </PressableScale>
        </GlassCard>
      ) : items.length === 0 ? (
        <GlassCard style={styles.stateCard}>
          <Text variant="body" weight="semibold">
            {COPY.macroRadar.empty.title}
          </Text>
          <Text variant="caption" tone="muted">
            {COPY.macroRadar.empty.body}
          </Text>
        </GlassCard>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.railContent}
        >
          {items.map((item) => (
            <MacroRadarCard
              key={item.event.id}
              item={item}
              onPress={onPressEvent}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

interface MacroRadarCardProps {
  item: RadarItem;
  onPress?: (eventId: string) => void;
}

function MacroRadarCard({ item, onPress }: MacroRadarCardProps) {
  const { event, when, relative } = item;
  const biasTone = BIAS_TONE[event.goldBias];
  const impactColor = IMPACT_COLOR[event.impact];
  const biasLabel = COPY.macroRadar.bias[event.goldBias];
  const whenLabel = COPY.macroRadar.when[when];

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${biasLabel}, ${relative}`}
      onPress={onPress ? () => onPress(event.id) : undefined}
      disabled={!onPress}
      style={styles.cardShell}
    >
      <GlassCard style={styles.card} padded={false}>
        <View style={styles.cardInner}>
          <View style={styles.cardHeader}>
            <View style={[styles.impactDot, { backgroundColor: impactColor }]} />
            <Text variant="caption" tone="muted" weight="semibold">
              {whenLabel.toUpperCase()} · {relative}
            </Text>
          </View>
          <Text variant="body" weight="semibold" numberOfLines={2}>
            {event.title}
          </Text>
          <View style={styles.cardFooter}>
            <Text variant="caption" tone={biasTone} weight="semibold">
              {biasLabel}
            </Text>
            <Text variant="caption" tone="subtle">
              {COPY.macroRadar.impact[event.impact]} impact
            </Text>
          </View>
        </View>
      </GlassCard>
    </PressableScale>
  );
}

function timeDelta(item: RadarItem, anchor: number): number {
  return new Date(item.event.at).getTime() - anchor;
}

function buildRadarItem(event: MacroRadarEvent, anchor: number): RadarItem {
  const eventMs = new Date(event.at).getTime();
  const delta = eventMs - anchor;
  const absMinutes = Math.abs(delta) / 60_000;
  const when: RadarItem["when"] =
    absMinutes < 30 ? "now" : delta < 0 ? "past" : "future";
  return { event, when, relative: formatRelative(delta) };
}

function formatRelative(deltaMs: number): string {
  const abs = Math.abs(deltaMs);
  const minutes = Math.round(abs / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) {
    return deltaMs >= 0 ? `in ${minutes}m` : `${minutes}m ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return deltaMs >= 0 ? `in ${hours}h` : `${hours}h ago`;
  }
  const days = Math.round(hours / 24);
  return deltaMs >= 0 ? `in ${days}d` : `${days}d ago`;
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  header: {
    gap: spacing.xs,
  },
  stateCard: {
    gap: spacing.xs,
  },
  retryButton: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.accent.gold,
  },
  railContent: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  cardShell: {
    width: 196,
  },
  card: {
    minHeight: 112,
  },
  cardInner: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  impactDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
