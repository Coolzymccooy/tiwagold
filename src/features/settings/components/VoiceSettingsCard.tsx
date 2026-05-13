import { StyleSheet, Switch, View } from "react-native";
import { Text } from "@/design/primitives";
import { palette, spacing } from "@/design/tokens";
import {
  selectAutoPlay,
  useVoiceStore,
} from "@/state/voiceStore";
import { SectionCard } from "./SectionCard";

/**
 * Voice replies — autoplay toggle for assistant copilot messages.
 *
 * Voice selection is fixed to the cloud-api default for the MVP. A picker
 * can land later once we surface the available voices via /voice/voices.
 */
export function VoiceSettingsCard() {
  const autoPlay = useVoiceStore(selectAutoPlay);
  const setAutoPlay = useVoiceStore((s) => s.setAutoPlayAssistant);

  return (
    <SectionCard title="Voice">
      <View style={styles.row}>
        <View style={styles.labelGroup}>
          <Text variant="body" weight="medium">
            Speak copilot replies
          </Text>
          <Text variant="caption" tone="muted">
            Auto-play each assistant message as it lands.
          </Text>
        </View>
        <Switch
          value={autoPlay}
          onValueChange={setAutoPlay}
          trackColor={{ false: palette.hairline, true: palette.accent.goldDeep }}
          thumbColor={autoPlay ? palette.accent.goldBright : palette.fg.muted}
          ios_backgroundColor={palette.hairline}
        />
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  labelGroup: {
    flex: 1,
    gap: spacing.xs,
  },
});
