import { useCallback, useEffect, useRef, useState } from "react";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import {
  speakRemote,
  VoiceServiceError,
  type SpeakRequest,
} from "@/services/voice";
import { selectVoiceId, useVoiceStore } from "@/state/voiceStore";

export type TtsPlaybackState = "idle" | "loading" | "playing" | "error";

export interface TtsPlaybackController {
  state: TtsPlaybackState;
  provider: string | null;
  error: string | null;
  /** Synthesize + play the given text. Cancels any in-flight playback first. */
  speak: (text: string, options?: { voice?: string }) => Promise<void>;
  /** Stop the current playback (if any). */
  stop: () => void;
}

/**
 * Hook that synthesises text via cloud-api `/voice/speak` and plays the
 * resulting audio through expo-audio. Single concurrent playback per hook
 * instance — calling `speak()` again interrupts the previous clip.
 *
 * Use one instance per UI surface (a screen, a message bubble), not one
 * shared globally — each `useTtsPlayback` owns its own `AudioPlayer`.
 */
export function useTtsPlayback(): TtsPlaybackController {
  const [state, setState] = useState<TtsPlaybackState>("idle");
  const [provider, setProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const requestIdRef = useRef(0);
  const voiceId = useVoiceStore(selectVoiceId);

  const releasePlayer = useCallback(() => {
    const player = playerRef.current;
    playerRef.current = null;
    if (!player) return;
    try {
      player.pause();
    } catch {
      // ignore — player may already be torn down
    }
    try {
      player.remove();
    } catch {
      // ignore
    }
  }, []);

  const stop = useCallback(() => {
    requestIdRef.current += 1;
    releasePlayer();
    setState("idle");
  }, [releasePlayer]);

  useEffect(() => {
    return () => {
      releasePlayer();
    };
  }, [releasePlayer]);

  const speak = useCallback(
    async (text: string, options?: { voice?: string }) => {
      const trimmed = text.trim();
      if (trimmed.length === 0) return;

      const requestId = ++requestIdRef.current;
      releasePlayer();
      setError(null);
      setState("loading");

      const request: SpeakRequest = {
        text: trimmed,
        voice: options?.voice ?? (voiceId.length > 0 ? voiceId : undefined),
        format: "mp3",
      };

      let result;
      try {
        result = await speakRemote(request);
      } catch (err) {
        if (requestId !== requestIdRef.current) return; // superseded
        setState("error");
        setError(
          err instanceof VoiceServiceError ? err.message : "voice_unavailable",
        );
        return;
      }

      if (requestId !== requestIdRef.current) return; // superseded mid-fetch

      try {
        const player = createAudioPlayer({ uri: result.uri });
        playerRef.current = player;
        const onEnd = () => {
          // The clip finished organically — drop back to idle if this is
          // still the active request.
          if (requestId === requestIdRef.current) setState("idle");
        };
        player.addListener("playbackStatusUpdate", (status) => {
          if (status.didJustFinish) onEnd();
        });
        setProvider(result.provider);
        setState("playing");
        player.play();
      } catch (err) {
        setState("error");
        setError(err instanceof Error ? err.message : "playback_failed");
      }
    },
    [releasePlayer, voiceId],
  );

  return { state, provider, error, speak, stop };
}
