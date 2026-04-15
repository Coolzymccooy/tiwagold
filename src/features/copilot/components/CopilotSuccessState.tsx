import { useEffect, useRef } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { spacing } from "@/design/tokens";
import { MessageBubble } from "./MessageBubble";
import { PromptChipList } from "./PromptChipList";
import { TypingIndicator } from "./TypingIndicator";
import type { CopilotView } from "../types";

export interface CopilotSuccessStateProps {
  view: CopilotView;
  onSelectPrompt: (prompt: string) => void;
  isSending: boolean;
}

export function CopilotSuccessState({
  view,
  onSelectPrompt,
  isSending,
}: CopilotSuccessStateProps) {
  const scrollRef = useRef<ScrollView>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: !reducedMotion });
  }, [view.messages.length, isSending, reducedMotion]);

  return (
    <View style={styles.successShell}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {view.messages.map((row) => (
          <MessageBubble key={row.id} row={row} />
        ))}
        {isSending ? <TypingIndicator /> : null}
      </ScrollView>
      <PromptChipList prompts={view.suggestedPrompts} onSelect={onSelectPrompt} />
    </View>
  );
}

const styles = StyleSheet.create({
  successShell: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
