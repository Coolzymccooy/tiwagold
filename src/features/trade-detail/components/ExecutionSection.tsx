import { StyleSheet, View } from "react-native";
import { ExpandableSection } from "@/components/ExpandableSection";
import { Text } from "@/design/primitives";
import { spacing } from "@/design/tokens";
import { COPY } from "@/content/copy";
import { useExecutionStatus } from "@/services";
import type { ExecutionStatus, Trade } from "@/types/trade";

export interface ExecutionSectionProps {
  trade: Trade;
}

interface ExecutionCell {
  label: string;
  value: string;
}

const NO_VALUE = COPY.tradeDetail.placeholder.noValue;
const NO_TICKET = COPY.tradeDetail.placeholder.noTicket;
const NO_FILL = COPY.tradeDetail.placeholder.noFill;

function formatTimestamp(iso: string | undefined): string {
  if (!iso) return NO_FILL;
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(value: number | undefined): string {
  return typeof value === "number" ? value.toFixed(2) : NO_FILL;
}

function formatSlippage(value: number | undefined): string {
  return typeof value === "number" ? `${value.toFixed(2)} pts` : NO_VALUE;
}

function formatTicket(value: string | null | undefined): string {
  return typeof value === "string" && value.length > 0 ? value : NO_TICKET;
}

function buildCells(status: ExecutionStatus): ExecutionCell[] {
  return [
    {
      label: COPY.tradeDetail.fields.phase,
      value: COPY.tradeDetail.executionPhase[status.phase],
    },
    {
      label: COPY.tradeDetail.fields.brokerTicket,
      value: formatTicket(status.brokerTicket),
    },
    {
      label: COPY.tradeDetail.fields.actualEntry,
      value: formatPrice(status.filledPrice),
    },
    {
      label: COPY.tradeDetail.fields.filledAt,
      value: formatTimestamp(status.filledAt),
    },
    {
      label: COPY.tradeDetail.fields.slippage,
      value: formatSlippage(status.slippage),
    },
    {
      label: COPY.tradeDetail.fields.attempt,
      value: `${status.attempt}`,
    },
    {
      label: COPY.tradeDetail.fields.lastCheckedAt,
      value: formatTimestamp(status.lastCheckedAt),
    },
  ];
}

function resolveLock(trade: Trade): {
  locked: boolean;
  reason?: string;
} {
  if (trade.status === "created") {
    return { locked: true, reason: COPY.tradeDetail.lock.executionPending };
  }
  const isTerminal =
    trade.status === "expired" ||
    trade.status === "cancelled" ||
    trade.autopsy !== undefined;
  if (isTerminal) {
    return { locked: true, reason: COPY.tradeDetail.lock.executionClosed };
  }
  return { locked: false };
}

export function ExecutionSection({ trade }: ExecutionSectionProps) {
  const lock = resolveLock(trade);
  const query = useExecutionStatus(lock.locked ? undefined : trade.id);

  return (
    <ExpandableSection
      title={COPY.tradeDetail.sections.execution}
      caption={COPY.tradeDetail.sectionCaptions.execution}
      locked={lock.locked}
      lockReason={lock.reason}
    >
      <ExecutionBody
        isLoading={query.isLoading}
        isError={query.isError}
        status={query.data}
      />
    </ExpandableSection>
  );
}

interface ExecutionBodyProps {
  isLoading: boolean;
  isError: boolean;
  status: ExecutionStatus | undefined;
}

function ExecutionBody({ isLoading, isError, status }: ExecutionBodyProps) {
  if (isLoading) {
    return (
      <Text variant="body" tone="muted">
        {COPY.tradeDetail.loading}
      </Text>
    );
  }
  if (isError || !status) {
    return (
      <Text variant="body" tone="danger">
        {COPY.tradeDetail.error.body}
      </Text>
    );
  }
  const cells = buildCells(status);
  const rejection = status.rejectionMessage;
  return (
    <View style={styles.stack}>
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
      {rejection ? (
        <Text variant="body" tone="danger">
          {rejection}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
  },
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
});
