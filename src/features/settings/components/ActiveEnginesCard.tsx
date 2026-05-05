import { StyleSheet, Switch, View } from "react-native";
import { Zap } from "lucide-react-native";
import { GlassCard, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import { useTradingPrefsStore } from "@/state/tradingPrefsStore";
import type { EngineTier } from "@/types/trade";

interface EngineMeta {
  id: EngineTier;
  label: string;
  description: string;
}

const ENGINES: readonly EngineMeta[] = [
  {
    id: "conservative",
    label: "Conservative Engine",
    description: "Higher conviction, slower cadence, tighter risk caps",
  },
  {
    id: "aggressive",
    label: "Aggressive Engine",
    description: "Faster cadence, momentum-led, wider opportunity set",
  },
];

export function ActiveEnginesCard() {
  const engineEnabled = useTradingPrefsStore((state) => state.engineEnabled);
  const toggleEngine = useTradingPrefsStore((state) => state.toggleEngine);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Zap size={18} color={palette.accent.gold} />
        </View>
        <View style={styles.headerText}>
          <Text variant="title" weight="semibold">
            Active Engines
          </Text>
          <Text variant="caption" tone="muted">
            Choose which strategies push setups into your feed
          </Text>
        </View>
      </View>

      <View style={styles.list}>
        {ENGINES.map((engine, index) => {
          const enabled = engineEnabled[engine.id];
          return (
            <View
              key={engine.id}
              style={[
                styles.row,
                index === ENGINES.length - 1 ? null : styles.rowDivider,
              ]}
            >
              <View style={styles.rowText}>
                <Text variant="body" weight="semibold">
                  {engine.label}
                </Text>
                <Text variant="caption" tone="muted">
                  {engine.description}
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={() => toggleEngine(engine.id)}
                trackColor={{
                  false: palette.hairline,
                  true: palette.accent.goldDeep,
                }}
                thumbColor={
                  enabled ? palette.accent.goldBright : palette.fg.muted
                }
                ios_backgroundColor={palette.hairline}
              />
            </View>
          );
        })}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
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
  list: {
    gap: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.hairline,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
