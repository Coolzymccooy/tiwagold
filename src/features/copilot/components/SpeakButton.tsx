import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Pause, Volume2 } from "lucide-react-native";
import { PressableScale } from "@/design/primitives/PressableScale";
import { Text } from "@/design/primitives/Text";
import { palette, radius, spacing } from "@/design/tokens";
import { useTtsPlayback } from "@/hooks/useTtsPlayback";

export interface SpeakButtonProps {
  text: string;
}

/**
 * Compact 🔊 button shown under assistant messages. Tap to play, tap again
 * while playing to stop. Network/playback errors surface as a tiny inline
 * caption — no toast, no modal — because the copilot bubble is already a
 * dense surface and a failed speech bubble shouldn't dominate.
 */
export function SpeakButton({ text }: SpeakButtonProps) {
  const tts = useTtsPlayback();
  const isLoading = tts.state === "loading";
  const isPlaying = tts.state === "playing";
  const isError = tts.state === "error";

  const onPress = () => {
    if (isPlaying || isLoading) {
      tts.stop();
      return;
    }
    void tts.speak(text);
  };

  const label = isLoading ? "…" : isPlaying ? "Stop" : "Listen";
  const accessibilityLabel = isPlaying
    ? "Stop assistant audio"
    : "Listen to assistant reply";

  return (
    <View style={styles.row}>
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={styles.button}
        hitSlop={8}
      >
        <View style={styles.inner}>
          {isLoading ? (
            <ActivityIndicator size="small" color={palette.accent.goldDeep} />
          ) : isPlaying ? (
            <Pause size={14} color={palette.accent.goldDeep} />
          ) : (
            <Volume2 size={14} color={palette.accent.goldDeep} />
          )}
          <Text variant="caption" tone="accent" weight="semibold">
            {label}
          </Text>
        </View>
      </PressableScale>
      {isError ? (
        <Text variant="caption" tone="muted">
          Voice unavailable
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  button: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.hairline,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
