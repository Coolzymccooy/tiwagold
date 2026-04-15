import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { GlassCard, PressableScale, Screen, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import { COPY } from "@/content/copy";
import { AutopsyCard } from "./components/AutopsyCard";
import { LevelGrid } from "./components/LevelGrid";
import { StatusPill } from "./components/StatusPill";
import { TimelineRow } from "./components/TimelineRow";
import { TradeActions } from "./components/TradeActions";
import { TradeDetailSections } from "./components/TradeDetailSections";
import { TradeVisualizer } from "./components/TradeVisualizer";
import { useTradeDetail } from "./hooks";

export function TradeDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const tradeId = typeof params.id === "string" ? params.id : undefined;
  const {
    view,
    isLoading,
    isError,
    refetch,
    approve,
    execute,
    cancel,
    isApproving,
    isExecuting,
    isCancelling,
    isRequestingIntent,
    actionError,
  } = useTradeDetail(tradeId);

  if (isLoading) {
    return (
      <Screen padded>
        <GlassCard style={styles.stateCard}>
          <ActivityIndicator color={palette.accent.gold} />
          <Text variant="body" tone="muted" align="center">
            {COPY.tradeDetail.loading}
          </Text>
        </GlassCard>
      </Screen>
    );
  }

  if (isError || !view) {
    return (
      <Screen padded>
        <GlassCard style={styles.stateCard}>
          <Text variant="title" weight="semibold" align="center" tone="danger">
            {COPY.tradeDetail.error.title}
          </Text>
          <Text variant="body" tone="muted" align="center">
            {COPY.tradeDetail.error.body}
          </Text>
          <PressableScale
            accessibilityRole="button"
            onPress={refetch}
            style={styles.retry}
          >
            <Text variant="title" weight="semibold" align="center">
              {COPY.tradeDetail.error.retry}
            </Text>
          </PressableScale>
        </GlassCard>
      </Screen>
    );
  }

  const { trade, statusLabel, engineLabel, sessionLabel, levels, timeline } = view;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="caption" tone="muted" weight="medium">
            {trade.symbol.toUpperCase()} · {sessionLabel.toUpperCase()}
          </Text>
          <Text variant="headline" weight="bold">
            {trade.setupType}
          </Text>
          <Text variant="body" tone="muted">
            {engineLabel}
          </Text>
          <StatusPill status={trade.status} label={statusLabel} />
        </View>

        <GlassCard style={styles.sectionCard}>
          <Text variant="caption" tone="muted" weight="semibold">
            {COPY.tradeDetail.sections.visualizer.toUpperCase()}
          </Text>
          <TradeVisualizer trade={trade} />
        </GlassCard>

        <GlassCard style={styles.sectionCard}>
          <Text variant="caption" tone="muted" weight="semibold">
            {COPY.tradeDetail.sections.levels.toUpperCase()}
          </Text>
          <LevelGrid rows={levels} />
        </GlassCard>

        <TradeDetailSections
          trade={trade}
          engineLabel={engineLabel}
          sessionLabel={sessionLabel}
        />

        <GlassCard style={styles.sectionCard}>
          <Text variant="caption" tone="muted" weight="semibold">
            {COPY.tradeDetail.sections.timeline.toUpperCase()}
          </Text>
          {timeline.length === 0 ? (
            <Text variant="body" tone="muted">
              {COPY.tradeDetail.empty.timeline}
            </Text>
          ) : (
            <View style={styles.timeline}>
              {timeline.map((row) => (
                <TimelineRow key={row.event.id} row={row} />
              ))}
            </View>
          )}
        </GlassCard>

        {trade.autopsy ? <AutopsyCard autopsy={trade.autopsy} /> : null}

        <TradeActions
          view={view}
          approve={approve}
          execute={execute}
          cancel={cancel}
          isApproving={isApproving}
          isExecuting={isExecuting}
          isCancelling={isCancelling}
          isRequestingIntent={isRequestingIntent}
          actionError={actionError}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: spacing.lg,
    paddingVertical: spacing.xl,
    paddingBottom: spacing["3xl"],
  },
  header: {
    gap: spacing.sm,
  },
  sectionCard: {
    gap: spacing.md,
  },
  timeline: {
    gap: spacing.sm,
  },
  stateCard: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  retry: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.accent.gold,
  },
});
