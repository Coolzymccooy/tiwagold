import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist, type PersistStorage } from "zustand/middleware";
import type { EngineTier } from "@/types/trade";

const STORAGE_KEY = "tiwagold.trading_prefs.v1";

export interface TradingPrefsState {
  engineEnabled: Record<EngineTier, boolean>;
  maxDailyDrawdownPct: number;
  maxOpenPositions: number;
  hydrated: boolean;
}

export interface TradingPrefsStore extends TradingPrefsState {
  toggleEngine: (tier: EngineTier) => void;
  setEngineEnabled: (tier: EngineTier, enabled: boolean) => void;
  setMaxDailyDrawdownPct: (pct: number) => void;
  setMaxOpenPositions: (count: number) => void;
}

const defaultPrefs: Omit<TradingPrefsState, "hydrated"> = {
  engineEnabled: { conservative: true, aggressive: false },
  maxDailyDrawdownPct: 50,
  maxOpenPositions: 3,
};

const secureStorage: PersistStorage<Omit<TradingPrefsState, "hydrated">> =
  createJSONStorage(() => ({
    getItem: (key: string) => SecureStore.getItemAsync(key),
    setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
    removeItem: (key: string) => SecureStore.deleteItemAsync(key),
  })) as PersistStorage<Omit<TradingPrefsState, "hydrated">>;

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export const useTradingPrefsStore = create<TradingPrefsStore>()(
  persist(
    (set) => ({
      ...defaultPrefs,
      hydrated: false,
      toggleEngine: (tier) =>
        set((state) => ({
          engineEnabled: {
            ...state.engineEnabled,
            [tier]: !state.engineEnabled[tier],
          },
        })),
      setEngineEnabled: (tier, enabled) =>
        set((state) => ({
          engineEnabled: { ...state.engineEnabled, [tier]: enabled },
        })),
      setMaxDailyDrawdownPct: (pct) =>
        set({ maxDailyDrawdownPct: clamp(Math.round(pct), 0, 100) }),
      setMaxOpenPositions: (count) =>
        set({ maxOpenPositions: clamp(Math.round(count), 1, 20) }),
    }),
    {
      name: STORAGE_KEY,
      storage: secureStorage,
      partialize: (state) => ({
        engineEnabled: state.engineEnabled,
        maxDailyDrawdownPct: state.maxDailyDrawdownPct,
        maxOpenPositions: state.maxOpenPositions,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
