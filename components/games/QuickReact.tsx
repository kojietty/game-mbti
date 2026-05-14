"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { scoreQuickReact } from "@/lib/scoring";
import type { GameResult } from "@/lib/types";
import { SE } from "@/lib/sound";
import { GameShell } from "./GameShell";

interface Props {
  onComplete: (result: GameResult) => void;
}

type Phase = "ready" | "waiting" | "reacting" | "flying" | "done";

interface Trial {
  ms: number | null;
  flying: boolean;
}

const TOTAL_TRIALS = 5;
const MIN_WAIT_MS = 1500;
const MAX_WAIT_MS = 4500;

export function QuickReact({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [trialIndex, setTrialIndex] = useState(0);
  const [trials, setTrials] = useState<Trial[]>([]);
  const startRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pausedRef = useRef(false);

  const clearWait = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startWaiting = useCallback(() => {
    clearWait();
    setPhase("waiting");
    const delay = MIN_WAIT_MS + Math.random() * (MAX_WAIT_MS - MIN_WAIT_MS);
    timeoutRef.current = setTimeout(() => {
      if (!pausedRef.current) {
        setPhase("reacting");
        startRef.current = performance.now();
      }
    }, delay);
  }, []);

  // Clean up on unmount
  useEffect(() => () => clearWait(), []);

  const handleTap = useCallback(() => {
    if (pausedRef.current) return;

    if (phase === "ready") {
      startWaiting();
      return;
    }

    if (phase === "waiting") {
      // Flying!
      clearWait();
      SE.fail();
      const newTrials = [...trials, { ms: null, flying: true }];
      setTrials(newTrials);
      setPhase("flying");
      const nextIndex = trialIndex + 1;
      setTrialIndex(nextIndex);
      if (nextIndex >= TOTAL_TRIALS) {
        finalize(newTrials);
        return;
      }
      setTimeout(() => startWaiting(), 800);
      return;
    }

    if (phase === "reacting") {
      const ms = performance.now() - startRef.current;
      SE.success();
      const newTrials = [...trials, { ms, flying: false }];
      setTrials(newTrials);
      const nextIndex = trialIndex + 1;
      setTrialIndex(nextIndex);
      if (nextIndex >= TOTAL_TRIALS) {
        setPhase("done");
        finalize(newTrials);
        return;
      }
      setPhase("waiting");
      startWaiting();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, trials, trialIndex, startWaiting]);

  function finalize(finalTrials: Trial[]) {
    const validMs = finalTrials.filter((t) => !t.flying && t.ms != null).map((t) => t.ms as number);
    const avgMs = validMs.length > 0 ? validMs.reduce((a, b) => a + b, 0) / validMs.length : 600;
    const flyingCount = finalTrials.filter((t) => t.flying).length;
    const { score, axisDeltas } = scoreQuickReact({ avgMs, flyingCount });

    const result: GameResult = {
      gameId: "quick-react",
      score,
      durationMs: 0,
      rawData: { avgMs: Math.round(avgMs), flyingCount, trials: finalTrials },
      axisDeltas,
    };
    setPhase("done");
    setTimeout(() => onComplete(result), 600);
  }

  // Keyboard: space key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && phase !== "done") {
        e.preventDefault();
        handleTap();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleTap, phase]);

  const handleRestart = () => {
    clearWait();
    setPhase("ready");
    setTrialIndex(0);
    setTrials([]);
  };

  return (
    <GameShell
      onRestart={handleRestart}
    >
      {(paused) => {
        pausedRef.current = paused;

        return (
          <button
            type="button"
            aria-label="React game area — tap or press space"
            className={`
              fixed inset-0 w-full h-full flex flex-col items-center justify-center gap-6
              transition-colors duration-150 cursor-pointer select-none focus:outline-none
              ${phase === "reacting" ? "bg-[var(--color-success)]" : "bg-[var(--color-surface)]"}
            `}
            onClick={handleTap}
          >
            {/* Trial counter */}
            <p className="absolute top-8 left-0 right-0 text-center text-xs tracking-widest text-[var(--color-muted)]">
              {phase !== "ready" && `TRIAL ${Math.min(trialIndex + 1, TOTAL_TRIALS)} / ${TOTAL_TRIALS}`}
            </p>

            {phase === "ready" && (
              <div className="text-center space-y-4">
                <p className="text-2xl font-bold">タップして開始</p>
                <p className="text-sm text-[var(--color-muted)]">Press SPACE or tap anywhere</p>
              </div>
            )}

            {phase === "waiting" && (
              <div className="text-center" aria-live="polite">
                <span className="text-8xl" aria-label="waiting: red triangle">▲</span>
                <p className="mt-6 text-xl tracking-widest text-[var(--color-muted)]">待機中…</p>
              </div>
            )}

            {phase === "reacting" && (
              <div className="text-center" aria-live="assertive">
                <span className="text-8xl text-black" aria-label="go: green circle">●</span>
                <p className="mt-6 text-3xl font-black text-black tracking-widest">GO!</p>
              </div>
            )}

            {phase === "flying" && (
              <div className="text-center" aria-live="polite">
                <span className="text-6xl">⚡</span>
                <p className="mt-4 text-xl font-bold text-[var(--color-warning)]">フライング！</p>
              </div>
            )}

            {phase === "done" && (
              <div className="text-center space-y-4 pointer-events-none">
                <p className="text-xl font-bold text-[var(--color-success)]">完了！</p>
                {trials.map((t, i) => (
                  <p key={i} className="text-sm font-mono">
                    Trial {i + 1}:{" "}
                    {t.flying ? (
                      <span className="text-[var(--color-warning)]">FLYING</span>
                    ) : (
                      <span className="text-[var(--color-primary)]">{Math.round(t.ms!)} ms</span>
                    )}
                  </p>
                ))}
              </div>
            )}
          </button>
        );
      }}
    </GameShell>
  );
}
