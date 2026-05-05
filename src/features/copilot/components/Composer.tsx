import { useCallback } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";
import { PressableScale } from "@/design/primitives/PressableScale";
import { Text } from "@/design/primitives/Text";
import { font, palette, radius, spacing } from "@/design/tokens";
import { COPY } from "@/content/copy";

export interface ComposerProps {
  draft: string;
  onChangeDraft: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
}

export function Composer({
  draft,
  onChangeDraft,
  onSend,
  isSending,
}: ComposerProps) {
  const canSend = draft.trim().length > 0 && !isSending;
  const buttonLabel = isSending ? COPY.copilot.sending : COPY.copilot.send;

  const handleSend = useCallback(() => {
    if (!canSend) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend();
  }, [canSend, onSend]);

  return (
    <View style={styles.shell}>
      <TextInput
        value={draft}
        onChangeText={onChangeDraft}
        placeholder={COPY.copilot.placeholder}
        placeholderTextColor={palette.fg.subtle}
        multiline
        style={styles.input}
        editable={!isSending}
        returnKeyType="default"
        accessibilityLabel={COPY.copilot.placeholder}
      />
      <PressableScale
        onPress={handleSend}
        disabled={!canSend}
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
      >
        <Text
          variant="caption"
          tone={canSend ? "primary" : "muted"}
          weight="semibold"
        >
          {buttonLabel}
        </Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: palette.bg.elevated,
    borderTopWidth: 1,
    borderTopColor: palette.hairline,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 140,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.hairline,
    backgroundColor: palette.bg.base,
    color: palette.fg.primary,
    fontFamily: font.sansWeights.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  sendButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: palette.accent.gold,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: palette.bg.elevated,
    borderWidth: 1,
    borderColor: palette.hairline,
  },
});
