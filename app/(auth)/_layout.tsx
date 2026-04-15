import { Stack } from "expo-router";
import { palette } from "@/design/tokens";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.bg.base },
        animation: "slide_from_right",
        gestureEnabled: true,
      }}
    />
  );
}
