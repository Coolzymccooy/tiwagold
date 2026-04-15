import { StyleSheet, View } from "react-native";
import { Text } from "@/design/primitives/Text";
import { spacing } from "@/design/tokens";
import { COPY } from "@/content/copy";
import { PromptChipList } from "./PromptChipList";
import type { CopilotSuggestedPromptRow } from "../types";

export interface CopilotEmptyStateProps {
  prompts: CopilotSuggestedPromptRow[];
  onSelectPrompt: (prompt: string) => void;
}

export function CopilotEmptyState({ prompts, onSelectPrompt }: CopilotEmptyStateProps) {
  return (
    <View style={styles.emptyShell}>
      <View style={styles.emptyCopy}>
        <Text variant="title" weight="semibold">
          {COPY.copilot.empty.title}
        </Text>
        <Text variant="body" tone="muted" align="center">
          {COPY.copilot.empty.body}
        </Text>
      </View>
      <PromptChipList prompts={prompts} onSelect={onSelectPrompt} />
    </View>
  );
}

const styles = StyleSheet.create({
  emptyShell: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: spacing.md,
  },
  emptyCopy: {
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
});
