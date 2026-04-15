import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { GlassCard, PressableScale, Screen, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import { COPY } from "@/content/copy";
import { BreakdownList, type BreakdownRow } from "./components/BreakdownList";
import { EquitySparklineCard } from "./components/EquitySparklineCard";
import { KpiGrid } from "./components/KpiGrid";
import { useAnalytics } from "./hooks";
import type { EngineRow, ModeRow, SessionRow } from "./types";

export function AnalyticsScreen() {
  const { view, isLoading, isError, refetch } = useAnalytics();

  if (isLoading) {
    return (
      <Screen padded>
        <GlassCard style={styles.stateCard}>
          <ActivityIndicator color={palette.accent.gold} />
        </GlassCard>
      </Screen>
    );
  }

  if (isError || !view) {
    return (
      <Screen padded>
        <GlassCard style={styles.stateCard}>
          <Text variant="title" weight="semibold" align="center" tone="danger">
            {COPY.analytics.empty.title}
          </Text>
          <Text variant="body" tone="muted" align="center">
            {COPY.analytics.empty.body}
          </Text>
          <PressableScale
            accessibilityRole="button"
            onPress={refetch}
            style={styles.retry}
          >
            <Text variant="title" weight="semibold" align="center">
              {COPY.common.retry}
            </Text>
          </PressableScale>
        </GlassCard>
      </Screen>
    );
  }

  if (!view.hasData) {
    return (
      <Screen padded>
        <GlassCard style={styles.stateCard}>
          <Text variant="title" weight="semibold" align="center">
            {COPY.analytics.empty.title}
          </Text>
          <Text variant="body" tone="muted" align="center">
            {COPY.analytics.empty.body}
          </Text>
        </GlassCard>
      </Screen>
    );
  }

  const changeTone = resolveChangeTone(view.equity.changeR);
  const changeLabel = formatChangeR(view.equity.changeR);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="headline" weight="bold">
            {COPY.analytics.title}
          </Text>
          <Text variant="caption" tone="muted">
            {COPY.analytics.subtitle}
          </Text>
        </View>

        <KpiGrid kpis={view.kpis} />

        <EquitySparklineCard
          equity={view.equity}
          title={COPY.analytics.sections.equity}
          changeRLabel={changeLabel}
          changeTone={changeTone}
        />

        <Section title={COPY.analytics.sections.byEngine}>
          <BreakdownList rows={view.engines.map(engineToRow)} />
        </Section>

        <Section title={COPY.analytics.sections.bySession}>
          <BreakdownList rows={view.sessions.map(sessionToRow)} />
        </Section>

        <Section title={COPY.analytics.sections.byMode}>
          <BreakdownList rows={view.modes.map(modeToRow)} />
        </Section>
      </ScrollView>
    </Screen>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <GlassCard style={styles.sectionCard}>
      <Text variant="caption" tone="muted" weight="semibold">
        {title.toUpperCase()}
      </Text>
      {children}
    </GlassCard>
  );
}

function engineToRow(row: EngineRow): BreakdownRow {
  return {
    id: row.breakdown.engine,
    label: row.engineLabel,
    tradesLabel: row.tradesLabel,
    winRateLabel: row.winRateLabel,
    avgRLabel: row.avgRLabel,
    avgRTone: resolveChangeTone(row.breakdown.avgR),
  };
}

function sessionToRow(row: SessionRow): BreakdownRow {
  return {
    id: row.breakdown.session,
    label: row.sessionLabel,
    tradesLabel: row.tradesLabel,
    winRateLabel: row.winRateLabel,
    avgRLabel: row.avgRLabel,
    avgRTone: resolveChangeTone(row.breakdown.avgR),
  };
}

function modeToRow(row: ModeRow): BreakdownRow {
  return {
    id: row.breakdown.mode,
    label: row.modeLabel,
    tradesLabel: row.tradesLabel,
    winRateLabel: row.winRateLabel,
    avgRLabel: row.avgRLabel,
    avgRTone: resolveChangeTone(row.breakdown.avgR),
  };
}

function resolveChangeTone(value: number): "primary" | "success" | "danger" {
  if (value > 0) return "success";
  if (value < 0) return "danger";
  return "primary";
}

function formatChangeR(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toFixed(2)}R`;
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: spacing.lg,
    paddingVertical: spacing.xl,
    paddingBottom: spacing["3xl"],
  },
  header: {
    gap: spacing.xs,
  },
  sectionCard: {
    gap: spacing.md,
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
