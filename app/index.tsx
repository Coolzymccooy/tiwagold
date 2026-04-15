import { ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { GlassCard, Screen } from "@/design/primitives";
import { palette } from "@/design/tokens";
import {
  selectIsAuthenticated,
  selectRequiresOnboarding,
  useAuthStore,
} from "@/state/authStore";

export default function IndexRoute() {
  const hydrated = useAuthStore((state) => state.hydrated);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const requiresOnboarding = useAuthStore(selectRequiresOnboarding);

  if (!hydrated) {
    return (
      <Screen padded>
        <GlassCard>
          <ActivityIndicator color={palette.accent.gold} />
        </GlassCard>
      </Screen>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (requiresOnboarding) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
