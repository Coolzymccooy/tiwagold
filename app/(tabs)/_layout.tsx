import { StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BarChart3, BellRing, Bot, Settings as SettingsIcon, TrendingUp } from "lucide-react-native";
import { COPY } from "@/content/copy";
import { font, palette, spacing } from "@/design/tokens";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.accent.gold,
        tabBarInactiveTintColor: palette.fg.subtle,
        tabBarStyle: [
          styles.tabBar,
          {
            paddingBottom: Math.max(insets.bottom, spacing.sm),
            height: 56 + Math.max(insets.bottom, spacing.sm),
          },
        ],
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        sceneStyle: { backgroundColor: palette.bg.base },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: COPY.tabs.trades,
          tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="pending"
        options={{
          title: COPY.tabs.pending,
          tabBarIcon: ({ color, size }) => <BellRing color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: COPY.tabs.analytics,
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="copilot"
        options={{
          title: COPY.tabs.copilot,
          tabBarIcon: ({ color, size }) => <Bot color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: COPY.tabs.settings,
          tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: palette.bg.elevated,
    borderTopColor: palette.hairline,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.xs,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: 0.2,
    fontFamily: font.sansWeights.medium,
  },
  tabItem: {
    paddingVertical: spacing.xs,
  },
});
