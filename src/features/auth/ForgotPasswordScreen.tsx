import { Pressable, StyleSheet, View } from "react-native";
import { Link } from "expo-router";
import { GlassCard, PressableScale, Screen, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import { COPY } from "@/content/copy";
import { AuthField } from "./components/AuthField";
import { useForgotPasswordForm } from "./hooks";
import { selectForgotPasswordEmailError } from "./selectors";

export function ForgotPasswordScreen() {
  const { state, canSubmit, setField, submit } = useForgotPasswordForm();
  const copy = COPY.auth.forgotPassword;
  const emailError = selectForgotPasswordEmailError(state);

  return (
    <Screen withKeyboardAvoid keyboardVerticalOffset={24}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="caption" tone="accent" weight="semibold">
            {COPY.brand.name.toUpperCase()}
          </Text>
          <Text variant="display" weight="bold">
            {copy.title}
          </Text>
          <Text variant="body" tone="muted">
            {copy.subtitle}
          </Text>
        </View>

        <GlassCard style={styles.card}>
          <AuthField
            label={copy.emailLabel}
            value={state.email}
            onChangeText={(v) => setField("email", v)}
            placeholder={copy.emailPlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            editable={!state.submitting}
            error={emailError}
          />

          {state.error ? (
            <Text variant="caption" tone="danger" style={styles.formError}>
              {state.error}
            </Text>
          ) : null}

          {state.success ? (
            <View style={styles.successBanner}>
              <Text variant="caption" tone="success" weight="semibold">
                {copy.success}
              </Text>
            </View>
          ) : null}

          <PressableScale
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit }}
            disabled={!canSubmit}
            onPress={submit}
            style={[
              styles.submit,
              !canSubmit ? styles.submitDisabled : null,
            ]}
          >
            <Text variant="title" weight="semibold" tone="primary" align="center">
              {state.submitting ? copy.submitting : copy.submit}
            </Text>
          </PressableScale>
        </GlassCard>

        <View style={styles.footer}>
          <Link href="/(auth)/login" asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={copy.backToLogin}
              hitSlop={8}
            >
              <Text variant="caption" tone="muted" align="center">
                {copy.backToLogin}
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  card: {
    gap: spacing.lg,
  },
  formError: {
    marginTop: -spacing.sm,
  },
  successBanner: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: palette.bg.glass,
    borderWidth: 1,
    borderColor: palette.hairline,
  },
  submit: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.accent.gold,
  },
  submitDisabled: {
    backgroundColor: palette.accent.goldDeep,
    opacity: 0.6,
  },
  footer: {
    alignItems: "center",
  },
});
