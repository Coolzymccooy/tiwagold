import { useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { GlassCard, PressableScale, Screen, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import { COPY } from "@/content/copy";
import { useBrokerConnections } from "@/services/broker";
import type { BrokerConnection } from "@/types/broker";
import {
  ActiveEnginesCard,
  BridgeStatusCard,
  DangerZoneCard,
  LegalRow,
  MT5ConnectCard,
  NotificationToggleRow,
  ProfilePanel,
  RiskManagementCard,
  RiskOptionRow,
  SectionCard,
  SignOutButton,
  VoiceSettingsCard,
} from "./components";
import {
  useDeleteAccountAction,
  useSettings,
  useSignOutAction,
} from "./hooks";
import type {
  LegalLinkId,
  NotificationToggleId,
  RiskProfileId,
} from "./types";

export function SettingsScreen() {
  const router = useRouter();
  const { view, isLoading, isError, refetch } = useSettings();
  const { signOut, isSigningOut } = useSignOutAction();
  const { deleteAccount, isDeleting } = useDeleteAccountAction();
  const brokers = useBrokerConnections();

  const mt5Connection = useMemo<BrokerConnection | undefined>(
    () => brokers.data?.find((c) => c.kind === "mt5"),
    [brokers.data],
  );

  const handleToggle = useCallback(
    (_id: NotificationToggleId, _next: boolean) => {
      // preference mutation wired in a later phase
    },
    [],
  );

  const handleRiskSelect = useCallback((_id: RiskProfileId) => {
    // risk profile mutation wired in a later phase
  }, []);

  const handleLegalPress = useCallback((_id: LegalLinkId) => {
    // legal links route via expo-linking in a later phase
  }, []);

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
            {COPY.settings.title}
          </Text>
          <Text variant="body" tone="muted" align="center">
            {COPY.common.retry}
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

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="headline" weight="bold">
            {COPY.settings.title}
          </Text>
          <Text variant="caption" tone="muted">
            Profile, brokers, and engines that drive your feed
          </Text>
        </View>

        <SectionCard title={COPY.settings.sections.profile}>
          <ProfilePanel profile={view.profile} />
        </SectionCard>

        <BridgeStatusCard />

        <MT5ConnectCard connection={mt5Connection} />

        <RiskManagementCard />

        <ActiveEnginesCard />

        <SectionCard title={COPY.settings.sections.risk}>
          {view.risk.map((row) => (
            <RiskOptionRow key={row.id} row={row} onSelect={handleRiskSelect} />
          ))}
        </SectionCard>

        <SectionCard title={COPY.settings.sections.notifications}>
          {view.notifications.map((row) => (
            <NotificationToggleRow
              key={row.id}
              row={row}
              onToggle={handleToggle}
            />
          ))}
        </SectionCard>

        <VoiceSettingsCard />

        <SectionCard title={COPY.settings.sections.legal}>
          {view.legal.map((row, index) => (
            <LegalRow
              key={row.id}
              row={row}
              onPress={handleLegalPress}
              isLast={index === view.legal.length - 1}
            />
          ))}
        </SectionCard>

        <PressableScale
          onPress={() => router.push("/help")}
          style={styles.helpCard}
          accessibilityRole="button"
          accessibilityLabel="How Tiwa works and the Blue Guardian rules"
        >
          <View style={styles.helpText}>
            <Text variant="body" weight="semibold">How Tiwa works & Blue Guardian rules</Text>
            <Text variant="caption" tone="muted">
              Signals, automated management, and the guardrails keeping your account safe
            </Text>
          </View>
          <Text variant="title" tone="muted">›</Text>
        </PressableScale>

        <SignOutButton
          label={COPY.settings.actions.signOut}
          onPress={signOut}
          isSigningOut={isSigningOut}
        />

        <DangerZoneCard
          onConfirmDelete={deleteAccount}
          isDeleting={isDeleting}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing["3xl"],
  },
  header: {
    gap: spacing.xs,
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
  helpCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.hairline,
    backgroundColor: palette.bg.glass,
  },
  helpText: {
    flex: 1,
    gap: 2,
  },
});
