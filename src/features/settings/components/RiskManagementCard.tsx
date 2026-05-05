import { StyleSheet, View } from "react-native";
import { ShieldCheck } from "lucide-react-native";
import { GlassCard, Slider, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import { useTradingPrefsStore } from "@/state/tradingPrefsStore";

const DRAWDOWN_MIN = 0;
const DRAWDOWN_MAX = 50;
const DRAWDOWN_STEP = 5;
const POSITIONS_MIN = 1;
const POSITIONS_MAX = 10;
const POSITIONS_STEP = 1;

export function RiskManagementCard() {
  const maxDailyDrawdownPct = useTradingPrefsStore(
    (state) => state.maxDailyDrawdownPct,
  );
  const maxOpenPositions = useTradingPrefsStore(
    (state) => state.maxOpenPositions,
  );
  const setMaxDailyDrawdownPct = useTradingPrefsStore(
    (state) => state.setMaxDailyDrawdownPct,
  );
  const setMaxOpenPositions = useTradingPrefsStore(
    (state) => state.setMaxOpenPositions,
  );

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <ShieldCheck size={18} color={palette.accent.gold} />
        </View>
        <View style={styles.headerText}>
          <Text variant="title" weight="semibold">
            Risk Management
          </Text>
          <Text variant="caption" tone="muted">
            Caps that protect capital across sessions
          </Text>
        </View>
      </View>

      <SliderRow
        label="Max Daily Drawdown"
        valueLabel={`${maxDailyDrawdownPct}%`}
        helper="Engines pause after this loss in a 24h window"
        value={maxDailyDrawdownPct}
        min={DRAWDOWN_MIN}
        max={DRAWDOWN_MAX}
        step={DRAWDOWN_STEP}
        onChange={setMaxDailyDrawdownPct}
      />

      <SliderRow
        label="Max Open Trades"
        valueLabel={`${maxOpenPositions}`}
        helper="Concurrent positions allowed across engines"
        value={maxOpenPositions}
        min={POSITIONS_MIN}
        max={POSITIONS_MAX}
        step={POSITIONS_STEP}
        onChange={setMaxOpenPositions}
      />
    </GlassCard>
  );
}

interface SliderRowProps {
  label: string;
  valueLabel: string;
  helper: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (next: number) => void;
}

function SliderRow({
  label,
  valueLabel,
  helper,
  value,
  min,
  max,
  step,
  onChange,
}: SliderRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text variant="body" weight="semibold">
          {label}
        </Text>
        <Text variant="body" weight="bold" tone="accent" family="mono">
          {valueLabel}
        </Text>
      </View>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
      />
      <Text variant="caption" tone="muted">
        {helper}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(233,177,76,0.10)",
    borderWidth: 1,
    borderColor: palette.accent.goldDeep,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  row: {
    gap: spacing.sm,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
