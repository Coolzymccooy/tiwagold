import { Pressable, StyleSheet, View } from "react-native";
import { Link } from "expo-router";
import { GlassCard, PressableScale, Screen, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import { COPY } from "@/content/copy";
import { AuthField } from "./components/AuthField";
import { useLoginForm } from "./hooks";
import { selectEmailError, selectPasswordError } from "./selectors";

export function LoginScreen() {
  const { state, canSubmit, setField, submit } = useLoginForm();
  const copy = COPY.auth.login;
  const emailError = selectEmailError(state);
  const passwordError = selectPasswordError(state);

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
          <View style={styles.fields}>
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
            <AuthField
              label={copy.passwordLabel}
              value={state.password}
              onChangeText={(v) => setField("password", v)}
              placeholder={copy.passwordPlaceholder}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              toggleVisibility
              textContentType="password"
              editable={!state.submitting}
              error={passwordError}
            />
          </View>

          <View style={styles.forgotRow}>
            <Link href="/(auth)/forgot-password" asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={copy.forgotPassword}
                hitSlop={8}
              >
                <Text variant="caption" tone="accent" weight="semibold">
                  {copy.forgotPassword}
                </Text>
              </Pressable>
            </Link>
          </View>

          {state.error ? (
            <Text variant="caption" tone="danger" style={styles.formError}>
              {state.error}
            </Text>
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
          <Link href="/(auth)/signup" asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={copy.switchToSignup}
              hitSlop={8}
            >
              <Text variant="caption" tone="muted" align="center">
                {copy.switchToSignup}
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
  fields: {
    gap: spacing.md,
  },
  forgotRow: {
    alignItems: "flex-end",
    marginTop: spacing.xs,
  },
  formError: {
    marginTop: -spacing.sm,
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
