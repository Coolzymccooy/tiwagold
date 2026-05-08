import { useState } from "react";
import { ActivityIndicator, StyleSheet, TextInput, View } from "react-native";
import { ChevronLeft, KeyRound, Link2, ServerCog, User } from "lucide-react-native";
import { GlassCard, PressableScale, Text } from "@/design/primitives";
import { font, palette, radius, spacing, type as typeTokens } from "@/design/tokens";
import { useConnectMT5, MT5_SERVERS, type MT5Server } from "@/services/mt5";
import {
  bridgeStatusToPill,
  useBridgeStatus,
  useDisconnectBroker,
  type BridgeStatusPillTone,
} from "@/services/broker";
import type { BrokerConnection } from "@/types/broker";
import { RotateBridgeTokenButton } from "./RotateBridgeTokenButton";

export interface MT5ConnectCardProps {
  connection: BrokerConnection | undefined;
}

export function MT5ConnectCard({ connection }: MT5ConnectCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [password, setPassword] = useState("");
  const [server, setServer] = useState<MT5Server>("MetaQuotes-Demo");
  const [error, setError] = useState<string | null>(null);

  const { connect, isConnecting } = useConnectMT5();
  const disconnectMutation = useDisconnectBroker();
  const bridgeStatusQuery = useBridgeStatus();
  const pill = bridgeStatusToPill(bridgeStatusQuery.data ?? null);
  const lastError = bridgeStatusQuery.data?.lastError ?? null;

  const isConnected = connection?.connected === true;

  const canSubmit =
    accountId.trim().length > 0 && password.length >= 6 && !isConnecting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    try {
      await connect({ accountId: accountId.trim(), password, server });
      setShowForm(false);
      setAccountId("");
      setPassword("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't connect MT5.");
    }
  };

  const handleDisconnect = () => {
    if (!connection) return;
    disconnectMutation.mutate({ connectionId: connection.connectionId });
  };

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Link2 size={18} color={palette.accent.gold} />
        </View>
        <View style={styles.headerText}>
          <Text variant="title" weight="semibold">
            Broker Status
          </Text>
          <Text variant="caption" tone="muted">
            {isConnected
              ? `Connected to ${connection?.accountLabel ?? "MT5"}`
              : "Connect MT5 to execute trades"}
          </Text>
        </View>
        <View
          accessibilityRole="text"
          accessibilityLabel={`Execution bridge status: ${pill.label}`}
          style={[
            styles.pill,
            { borderColor: pillBorder(pill.tone) },
          ]}
        >
          <View style={[styles.pillDot, { backgroundColor: pillDot(pill.tone) }]} />
          <Text variant="caption" weight="semibold" style={{ color: pillText(pill.tone) }}>
            {pill.label}
          </Text>
        </View>
      </View>

      {pill.showError && lastError ? (
        <Text variant="caption" tone="danger" style={styles.errorLine}>
          {lastError}
        </Text>
      ) : null}

      {isConnected ? (
        <View style={styles.statusBlock}>
          <View style={styles.statusRow}>
            <Text variant="caption" tone="muted">
              Balance
            </Text>
            <Text variant="body" weight="semibold" family="mono">
              {connection?.balance !== undefined
                ? `${connection.currency ?? "USD"} ${connection.balance.toLocaleString()}`
                : "—"}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text variant="caption" tone="muted">
              Equity
            </Text>
            <Text variant="body" weight="semibold" tone="accent" family="mono">
              {connection?.equity !== undefined
                ? `${connection.currency ?? "USD"} ${connection.equity.toLocaleString()}`
                : "—"}
            </Text>
          </View>
          <PressableScale
            accessibilityRole="button"
            onPress={handleDisconnect}
            disabled={disconnectMutation.isPending}
            style={styles.disconnectBtn}
          >
            <Text variant="body" weight="semibold">
              {disconnectMutation.isPending ? "Disconnecting…" : "Disconnect"}
            </Text>
          </PressableScale>
        </View>
      ) : showForm ? (
        <View style={styles.form}>
          <View style={styles.formHeader}>
            <Text variant="caption" tone="muted" weight="semibold">
              MT5 CREDENTIALS
            </Text>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              onPress={() => {
                setShowForm(false);
                setError(null);
              }}
              style={styles.cancelLink}
              hitSlop={12}
            >
              <ChevronLeft size={14} color={palette.fg.muted} />
              <Text variant="caption" tone="muted" weight="medium">
                Cancel
              </Text>
            </PressableScale>
          </View>
          <FieldRow icon={<User size={16} color={palette.fg.muted} />}>
            <TextInput
              value={accountId}
              onChangeText={setAccountId}
              placeholder="Account ID"
              placeholderTextColor={palette.fg.subtle}
              autoCapitalize="none"
              keyboardType="number-pad"
              style={styles.input}
              editable={!isConnecting}
            />
          </FieldRow>
          <FieldRow icon={<KeyRound size={16} color={palette.fg.muted} />}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={palette.fg.subtle}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              editable={!isConnecting}
            />
          </FieldRow>
          <FieldRow icon={<ServerCog size={16} color={palette.fg.muted} />}>
            <ServerSelector value={server} onChange={setServer} />
          </FieldRow>

          {error ? (
            <Text variant="caption" tone="danger">
              {error}
            </Text>
          ) : null}

          <PressableScale
            accessibilityRole="button"
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={[
              styles.connectBtn,
              !canSubmit ? styles.connectBtnDisabled : null,
            ]}
          >
            {isConnecting ? (
              <ActivityIndicator color={palette.fg.primary} />
            ) : (
              <Text variant="title" weight="bold" align="center">
                Secure Connect
              </Text>
            )}
          </PressableScale>
        </View>
      ) : (
        <PressableScale
          accessibilityRole="button"
          onPress={() => setShowForm(true)}
          style={styles.cta}
        >
          <Text
            variant="title"
            weight="bold"
            align="center"
            style={styles.ctaText}
          >
            Connect MT5 Account
          </Text>
        </PressableScale>
      )}

      <RotateBridgeTokenButton />
    </GlassCard>
  );
}

interface FieldRowProps {
  icon: React.ReactNode;
  children: React.ReactNode;
}

function FieldRow({ icon, children }: FieldRowProps) {
  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldIcon}>{icon}</View>
      {children}
    </View>
  );
}

interface ServerSelectorProps {
  value: MT5Server;
  onChange: (next: MT5Server) => void;
}

function ServerSelector({ value, onChange }: ServerSelectorProps) {
  const currentIndex = MT5_SERVERS.indexOf(value);
  const handlePress = () => {
    const nextIndex = (currentIndex + 1) % MT5_SERVERS.length;
    const next = MT5_SERVERS[nextIndex];
    if (next) onChange(next);
  };
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`MT5 server ${value}, tap to change`}
      onPress={handlePress}
      style={styles.serverPicker}
    >
      <Text variant="body" weight="semibold">
        {value}
      </Text>
    </PressableScale>
  );
}

function pillText(tone: BridgeStatusPillTone): string {
  if (tone === "success") return palette.status.success;
  if (tone === "accent") return palette.accent.gold;
  if (tone === "danger") return palette.status.danger;
  return palette.fg.muted;
}

function pillDot(tone: BridgeStatusPillTone): string {
  if (tone === "success") return palette.status.success;
  if (tone === "accent") return palette.accent.gold;
  if (tone === "danger") return palette.status.danger;
  return palette.fg.subtle;
}

function pillBorder(tone: BridgeStatusPillTone): string {
  if (tone === "muted") return palette.hairline;
  return pillDot(tone);
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
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: palette.bg.elevated,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  errorLine: {
    marginTop: -spacing.xs,
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
  cta: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.accent.gold,
    alignItems: "center",
  },
  ctaText: {
    color: palette.bg.base,
  },
  form: {
    gap: spacing.sm,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cancelLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.hairline,
    backgroundColor: palette.bg.elevated,
  },
  fieldIcon: {
    width: 18,
    alignItems: "center",
  },
  input: {
    flex: 1,
    color: palette.fg.primary,
    fontFamily: font.sansWeights.medium,
    fontSize: typeTokens.body.fontSize,
    lineHeight: typeTokens.body.lineHeight,
  },
  serverPicker: {
    flex: 1,
  },
  connectBtn: {
    marginTop: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.accent.gold,
    alignItems: "center",
  },
  connectBtnDisabled: {
    backgroundColor: palette.accent.goldDeep,
    opacity: 0.6,
  },
  statusBlock: {
    gap: spacing.sm,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  disconnectBtn: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.hairline,
    alignItems: "center",
  },
});
