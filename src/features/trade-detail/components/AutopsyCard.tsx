import { StyleSheet, View } from "react-native";
import { ExpandableSection } from "@/components/ExpandableSection";
import { Text } from "@/design/primitives";
import { spacing } from "@/design/tokens";
import { COPY } from "@/content/copy";
import type { TradeAutopsy } from "@/types/trade";

export interface AutopsyCardProps {
  autopsy: TradeAutopsy;
}

type OutcomeTone = "success" | "danger" | "muted";

function outcomeTone(outcome: TradeAutopsy["outcome"]): OutcomeTone {
  if (outcome === "win") return "success";
  if (outcome === "loss") return "danger";
  return "muted";
}

function outcomeLabel(outcome: TradeAutopsy["outcome"]): string {
  return COPY.tradeDetail.autopsy.outcome[outcome];
}

function formatR(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}R`;
}

function formatPnl(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`;
}

export function AutopsyCard({ autopsy }: AutopsyCardProps) {
  const tone = outcomeTone(autopsy.outcome);
  const lessons = autopsy.lessons;

  return (
    <ExpandableSection
      title={COPY.tradeDetail.sections.autopsy}
      caption={COPY.tradeDetail.sectionCaptions.autopsy}
      defaultExpanded
      trailing={
        <Text variant="body" tone={tone} weight="semibold">
          {outcomeLabel(autopsy.outcome).toUpperCase()} · {formatR(autopsy.pnlR)}
        </Text>
      }
    >
      <View style={styles.row}>
        <Stat
          label={COPY.tradeDetail.autopsy.stats.exit}
          value={autopsy.exitPrice.toFixed(2)}
        />
        <Stat
          label={COPY.tradeDetail.autopsy.stats.pnl}
          value={formatPnl(autopsy.pnl)}
          tone={tone}
        />
        <Stat
          label={COPY.tradeDetail.autopsy.stats.duration}
          value={formatDuration(autopsy.durationMinutes)}
        />
      </View>

      <Text variant="body" tone="muted">
        {autopsy.exitReason}
      </Text>

      {lessons.length > 0 ? (
        <View style={styles.lessons}>
          <Text variant="caption" tone="subtle" weight="semibold">
            {COPY.tradeDetail.autopsy.lessons.toUpperCase()}
          </Text>
          {lessons.map((lesson, index) => (
            <Text key={`${index}-${lesson.slice(0, 16)}`} variant="body">
              · {lesson}
            </Text>
          ))}
        </View>
      ) : null}
    </ExpandableSection>
  );
}

interface StatProps {
  label: string;
  value: string;
  tone?: OutcomeTone;
}

function Stat({ label, value, tone }: StatProps) {
  return (
    <View style={styles.stat}>
      <Text variant="caption" tone="subtle">
        {label}
      </Text>
      <Text variant="body" weight="semibold" tone={tone}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  stat: {
    gap: spacing.xs,
    flex: 1,
  },
  lessons: {
    gap: spacing.xs,
  },
});
