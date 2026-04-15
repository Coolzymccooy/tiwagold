import { useCallback } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { GlassCard, PressableScale, Screen, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import { COPY } from "@/content/copy";
import {
  BrokerPanel,
  LegalRow,
  NotificationToggleRow,
  ProfilePanel,
  RiskOptionRow,
  SectionCard,
  SignOutButton,
} from "./components";
import { useSettings, useSignOutAction } from "./hooks";
import type {
  LegalLinkId,
  NotificationToggleId,
  RiskProfileId,
} from "./types";

export function SettingsScreen() {
  const { view, isLoading, isError, refetch } = useSettings();
  const { signOut, isSigningOut } = useSignOutAction();

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

  const handleConnect = useCallback(() => {
    // broker connect flow wired in a later phase
  }, []);

  const handleDisconnect = useCallback(() => {
    // broker disconnect flow wired in a later phase
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
        </View>

        <SectionCard title={COPY.settings.sections.profile}>
          <ProfilePanel profile={view.profile} />
        </SectionCard>

        <SectionCard title={COPY.settings.sections.broker}>
          <BrokerPanel
            broker={view.broker}
            connectLabel={COPY.settings.broker.connect}
            disconnectLabel={COPY.settings.broker.disconnect}
            lastSyncedLabel={COPY.settings.broker.lastSynced}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        </SectionCard>

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

        <SignOutButton
          label={COPY.settings.actions.signOut}
          onPress={signOut}
          isSigningOut={isSigningOut}
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
});
