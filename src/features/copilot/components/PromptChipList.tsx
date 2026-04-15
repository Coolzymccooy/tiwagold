import { ScrollView, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import { PressableScale } from "@/design/primitives/PressableScale";
import { Text } from "@/design/primitives/Text";
import { palette, radius, spacing } from "@/design/tokens";
import type { CopilotSuggestedPromptRow } from "../types";

export interface PromptChipListProps {
  prompts: CopilotSuggestedPromptRow[];
  onSelect: (prompt: string) => void;
}

export function PromptChipList({ prompts, onSelect }: PromptChipListProps) {
  if (prompts.length === 0) return null;

  const handleSelect = (prompt: string) => {
    void Haptics.selectionAsync();
    onSelect(prompt);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {prompts.map((prompt) => (
        <PressableScale
          key={`${prompt.kind}-${prompt.label}`}
          onPress={() => handleSelect(prompt.prompt)}
          accessibilityRole="button"
          accessibilityLabel={prompt.label}
          style={styles.chipShell}
        >
          <View style={styles.chip}>
            <Text variant="caption" tone="accent" weight="semibold">
              {prompt.label}
            </Text>
          </View>
        </PressableScale>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chipShell: {
    marginRight: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.accent.goldDeep,
    backgroundColor: "rgba(233,177,76,0.08)",
  },
});
