import { StyleSheet, View } from "react-native";
import { GlassCard, PressableScale, Screen, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import { COPY } from "@/content/copy";
import { ProgressBar } from "./components/ProgressBar";
import { RiskOption } from "./components/RiskOption";
import { useOnboarding } from "./hooks";
import type { RiskProfileId } from "./types";

export function OnboardingScreen() {
  const {
    state,
    stepId,
    canAdvance,
    isLastStep,
    progress,
    setRiskProfile,
    markBrokerConnected,
    next,
    back,
  } = useOnboarding();

  const step = COPY.onboarding.steps[state.stepIndex];
  if (!step) return null;

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <ProgressBar progress={progress} />
          <Text variant="caption" tone="muted" weight="medium">
            {step.eyebrow.toUpperCase()}
          </Text>
          <Text variant="headline" weight="bold">
            {step.title}
          </Text>
          <Text variant="body" tone="muted">
            {step.body}
          </Text>
        </View>

        <GlassCard style={styles.card}>
          {stepId === "risk" ? (
            <View style={styles.options}>
              {COPY.onboarding.riskOptions.map((option) => (
                <RiskOption
                  key={option.id}
                  label={option.label}
                  hint={option.hint}
                  selected={state.riskProfile === option.id}
                  onSelect={() => setRiskProfile(option.id as RiskProfileId)}
                />
              ))}
            </View>
          ) : null}

          {stepId === "broker" ? (
            <View style={styles.options}>
              <Text variant="body" tone="muted">
                Tiwa Gold starts you on a paper account. You can swap to live
                once you&apos;re comfortable.
              </Text>
              <PressableScale
                accessibilityRole="button"
                onPress={markBrokerConnected}
                style={[
                  styles.secondary,
                  state.brokerConnected ? styles.secondaryActive : null,
                ]}
              >
                <Text variant="title" weight="semibold" align="center">
                  {state.brokerConnected ? "Paper account connected" : "Connect paper account"}
                </Text>
              </PressableScale>
            </View>
          ) : null}

          {stepId === "welcome" ? (
            <Text variant="body" tone="muted">
              Zero noise. Every card you see is a XAU/USD setup that passed
              Tiwa&apos;s conservative, aggressive, and sniper engines.
            </Text>
          ) : null}
        </GlassCard>

        <View style={styles.footer}>
          <PressableScale
            accessibilityRole="button"
            accessibilityState={{ disabled: !canAdvance }}
            disabled={!canAdvance}
            onPress={next}
            style={[styles.primary, !canAdvance ? styles.primaryDisabled : null]}
          >
            <Text variant="title" weight="semibold" align="center">
              {isLastStep ? step.primary : step.primary}
            </Text>
          </PressableScale>
          {state.stepIndex > 0 ? (
            <PressableScale
              accessibilityRole="button"
              onPress={back}
              style={styles.back}
            >
              <Text variant="caption" tone="muted" align="center">
                Back
              </Text>
            </PressableScale>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.xl,
    paddingVertical: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  card: {
    gap: spacing.lg,
  },
  options: {
    gap: spacing.sm,
  },
  footer: {
    marginTop: "auto",
    gap: spacing.sm,
  },
  primary: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.accent.gold,
  },
  primaryDisabled: {
    backgroundColor: palette.accent.goldDeep,
    opacity: 0.6,
  },
  secondary: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.hairline,
    backgroundColor: palette.bg.elevated,
  },
  secondaryActive: {
    borderColor: palette.accent.gold,
    backgroundColor: "rgba(233,177,76,0.10)",
  },
  back: {
    paddingVertical: spacing.sm,
  },
});
