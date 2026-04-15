import { StyleSheet, View } from "react-native";
import { Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import type { TradeTimelineRow } from "../types";

export interface TimelineRowProps {
  row: TradeTimelineRow;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TimelineRow({ row }: TimelineRowProps) {
  const { event, isLatest } = row;
  return (
    <View style={styles.row}>
      <View style={styles.railColumn}>
        <View
          style={[styles.dot, isLatest ? styles.dotActive : styles.dotMuted]}
        />
        <View style={styles.line} />
      </View>
      <View style={styles.content}>
        <Text variant="caption" tone={isLatest ? "accent" : "muted"} weight="semibold">
          {event.kind.replace(/_/g, " ").toUpperCase()}
        </Text>
        <Text variant="body" weight="medium">
          {event.summary}
        </Text>
        {event.detail ? (
          <Text variant="caption" tone="muted">
            {event.detail}
          </Text>
        ) : null}
        <Text variant="caption" tone="subtle">
          {formatTimestamp(event.at)}
        </Text>
      </View>
    </View>
  );
}

const DOT_SIZE = 10;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  railColumn: {
    alignItems: "center",
    width: DOT_SIZE,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
  },
  dotActive: {
    backgroundColor: palette.accent.gold,
  },
  dotMuted: {
    backgroundColor: palette.fg.subtle,
  },
  line: {
    flex: 1,
    width: 1,
    backgroundColor: palette.hairline,
    marginTop: spacing.xs,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
});
