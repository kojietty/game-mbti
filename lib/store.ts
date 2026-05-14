import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameResult, FinalResult } from "./types";

interface PlayState {
  sessionId: string | null;
  gameIndex: number; // 0-7, which game is active
  results: GameResult[]; // completed game results (up to 8)
  startedAt: number | null; // Unix ms
}

interface SettingsState {
  consented: boolean;
  muted: boolean;
}

interface AppState extends PlayState, SettingsState {
  finalResult: FinalResult | null;

  startSession: () => void;
  submitGame: (result: GameResult) => void;
  setFinalResult: (result: FinalResult) => void;
  resetSession: () => void;
  setConsented: (v: boolean) => void;
  setMuted: (v: boolean) => void;
}

const GAMES_TOTAL = 12;

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // play state
      sessionId: null,
      gameIndex: 0,
      results: [],
      startedAt: null,
      finalResult: null,

      // settings (persisted independently)
      consented: true,
      muted: false,

      startSession: () => {
        set({
          sessionId: crypto.randomUUID(),
          gameIndex: 0,
          results: [],
          startedAt: Date.now(),
          finalResult: null,
        });
      },

      submitGame: (result) => {
        const { results, gameIndex } = get();
        const next = [...results, result];
        set({
          results: next,
          gameIndex: Math.min(gameIndex + 1, GAMES_TOTAL),
        });
      },

      setFinalResult: (result) => set({ finalResult: result }),

      resetSession: () =>
        set({
          sessionId: null,
          gameIndex: 0,
          results: [],
          startedAt: null,
          finalResult: null,
        }),

      setConsented: (v) => set({ consented: v }),
      setMuted: (v) => set({ muted: v }),
    }),
    {
      name: "ptl-session",
      // settings persist across sessions; play state resets on explicit reset
      partialize: (state) => ({
        sessionId: state.sessionId,
        gameIndex: state.gameIndex,
        results: state.results,
        startedAt: state.startedAt,
        finalResult: state.finalResult,
        consented: state.consented,
        muted: state.muted,
      }),
    }
  )
);

export const GAME_COUNT = GAMES_TOTAL;
