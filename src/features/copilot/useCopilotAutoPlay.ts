import { useEffect, useRef } from "react";
import { useTtsPlayback } from "@/hooks/useTtsPlayback";
import { selectAutoPlay, useVoiceStore } from "@/state/voiceStore";
import type { CopilotView } from "./types";

/**
 * Autoplay assistant copilot replies as soon as they transition to `complete`.
 *
 * No-op when:
 *   - autoplay is disabled in voice settings
 *   - the latest message isn't an assistant message
 *   - the message is still streaming/queued
 *   - we've already played this message id (tracked locally, no persistence —
 *     restarting the app re-plays the latest message once, which is acceptable)
 */
export function useCopilotAutoPlay(view: CopilotView | undefined): void {
  const autoPlay = useVoiceStore(selectAutoPlay);
  const tts = useTtsPlayback();
  const lastSpokenIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!autoPlay) return;
    const messages = view?.messages ?? [];
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (!last || !last.isAssistant) return;
    if (last.status !== "complete") return;
    if (last.content.trim().length === 0) return;
    if (lastSpokenIdRef.current === last.id) return;
    lastSpokenIdRef.current = last.id;
    void tts.speak(last.content);
  }, [autoPlay, view, tts]);
}
