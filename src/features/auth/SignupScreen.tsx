import { Pressable, StyleSheet, View } from "react-native";
import { Link } from "expo-router";
import { GlassCard, PressableScale, Screen, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import { COPY } from "@/content/copy";
import { AuthField } from "./components/AuthField";
import { useSignupForm } from "./hooks";
import {
  selectSignupEmailError,
  selectSignupNameError,
  selectSignupPasswordError,
} from "./selectors";

export function SignupScreen() {
  const { state, canSubmit, setField, submit } = useSignupForm();
  const copy = COPY.auth.signup;
  const nameError = selectSignupNameError(state);
  const emailError = selectSignupEmailError(state);
  const passwordError = selectSignupPasswordError(state);

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
              label={copy.nameLabel}
              value={state.name}
              onChangeText={(v) => setField("name", v)}
              placeholder={copy.namePlaceholder}
              autoCapitalize="words"
              autoCorrect={false}
              textContentType="name"
              editable={!state.submitting}
              error={nameError}
            />
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
              textContentType="newPassword"
              editable={!state.submitting}
              error={passwordError}
            />
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
          <Link href="/(auth)/login" asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={copy.switchToLogin}
              hitSlop={8}
            >
              <Text variant="caption" tone="muted" align="center">
                {copy.switchToLogin}
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
