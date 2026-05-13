import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist, type PersistStorage } from "zustand/middleware";

const STORAGE_KEY = "tiwagold.voice.v1";

export interface VoicePersistedState {
  /** Auto-play assistant copilot replies as soon as they arrive. */
  autoPlayAssistant: boolean;
  /**
   * Edge-TTS short-name (e.g. "en-US-AriaNeural"). Empty string means use the
   * cloud-api default (controlled by EDGE_TTS_VOICE).
   */
  voiceId: string;
}

export interface VoiceStore extends VoicePersistedState {
  hydrated: boolean;
  setAutoPlayAssistant: (enabled: boolean) => void;
  setVoiceId: (voice: string) => void;
}

const defaults: VoicePersistedState = {
  autoPlayAssistant: false,
  voiceId: "",
};

const secureStorage: PersistStorage<VoicePersistedState> = createJSONStorage(() => ({
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
})) as PersistStorage<VoicePersistedState>;

export const useVoiceStore = create<VoiceStore>()(
  persist(
    (set) => ({
      ...defaults,
      hydrated: false,
      setAutoPlayAssistant: (enabled) => set({ autoPlayAssistant: enabled }),
      setVoiceId: (voice) => set({ voiceId: voice.trim() }),
    }),
    {
      name: STORAGE_KEY,
      storage: secureStorage,
      partialize: (state) => ({
        autoPlayAssistant: state.autoPlayAssistant,
        voiceId: state.voiceId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

export const selectAutoPlay = (state: VoiceStore): boolean => state.autoPlayAssistant;
export const selectVoiceId = (state: VoiceStore): string => state.voiceId;
