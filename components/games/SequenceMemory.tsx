"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { scoreSequenceMemory } from "@/lib/scoring";
import type { GameResult } from "@/lib/types";
import { SE } from "@/lib/sound";
import { GameShell } from "./GameShell";

interface Props {
  onComplete: (result: GameResult) => void;
}

type Phase = "ready" | "showing" | "input" | "success" | "fail" | "done";

const CELLS = 4; // 2×2 grid
const SHOW_DELAY = 500; // ms per cell highlight

const COLORS = ["bg-cyan-400", "bg-fuchsia-300", "bg-green-400", "bg-orange-400"];
const INPUT_COLOR = "bg-white";

export function SequenceMemory({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [sequence, setSequence] = useState<number[]>([]);
  const [lit, setLit] = useState<number | null>(null);
  const [inputIndex, setInputIndex] = useState(0);
  const [reached, setReached] = useState(0);
  const [flashCell, setFlashCell] = useState<{ idx: number; correct: boolean } | null>(null);
  const pausedRef = useRef(false);

  const finalize = useCallback((finalReached: number) => {
    setPhase("done");
    const { score, axisDeltas } = scoreSequenceMemory({ reached: finalReached });
    setTimeout(() => onComplete({
      gameId: "sequence-memory",
      score,
      durationMs: 0,
      rawData: { reached: finalReached },
      axisDeltas,
    }), 500);
  }, [onComplete]);

  const playSequence = useCallback((seq: number[]) => {
    setPhase("showing");
    setLit(null);
    let i = 0;
    const step = () => {
      if (i < seq.length) {
        setLit(seq[i]);
        SE.tap();
        setTimeout(() => {
          setLit(null);
          i++;
          setTimeout(step, 200);
        }, SHOW_DELAY);
      } else {
        setPhase("input");
        setInputIndex(0);
      }
    };
    setTimeout(step, 400);
  }, []);

  const startLevel = useCallback((level: number) => {
    const newSeq = Array.from({ length: level + 2 }, () => Math.floor(Math.random() * CELLS));
    setSequence(newSeq);
    playSequence(newSeq);
  }, [playSequence]);

  const handleStart = () => {
    setReached(0);
    startLevel(0);
  };

  const handleCellTap = (idx: number) => {
    if (phase !== "input" || pausedRef.current) return;
    const expected = sequence[inputIndex];
    if (idx === expected) {
      SE.success();
      setFlashCell({ idx, correct: true });
      setTimeout(() => setFlashCell(null), 300);
      if (inputIndex + 1 === sequence.length) {
        // Level complete
        const nextReached = reached + 1;
        setReached(nextReached);
        setPhase("success");
        setTimeout(() => startLevel(nextReached), 700);
      } else {
        setInputIndex((i) => i + 1);
      }
    } else {
      SE.fail();
      setFlashCell({ idx, correct: false });
      setTimeout(() => {
        setFlashCell(null);
        finalize(reached);
      }, 600);
    }
  };

  // Keyboard 1-4
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const n = parseInt(e.key);
      if (n >= 1 && n <= 4) handleCellTap(n - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sequence, inputIndex, reached]);

  const handleRestart = () => {
    setPhase("ready");
    setSequence([]);
    setReached(0);
  };

  const cellColor = (idx: number) => {
    if (lit === idx) return COLORS[idx];
    if (flashCell?.idx === idx) return flashCell.correct ? "bg-[var(--color-success)]" : "bg-[var(--color-warning)]";
    return "bg-[var(--color-surface)] border border-[var(--color-border)]";
  };

  return (
    <GameShell onRestart={handleRestart}>
      {(paused) => {
        pausedRef.current = paused;
        return (
          <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-6">
            {/* Level / status */}
            <div className="text-center">
              {phase === "ready" && <p className="text-xl font-bold">タップして開始</p>}
              {phase === "showing" && <p className="text-sm text-[var(--color-muted)] tracking-widest">覚えろ…</p>}
              {phase === "input" && (
                <p className="text-sm text-[var(--color-primary)] tracking-widest">
                  入力 {inputIndex + 1} / {sequence.length}
                </p>
              )}
              {phase === "success" && <p className="text-lg font-bold text-[var(--color-success)]">正解！</p>}
              {phase !== "ready" && (
                <p className="text-xs text-[var(--color-muted)] mt-1">到達段数: {reached}</p>
              )}
            </div>

            {/* 2×2 Grid */}
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: CELLS }).map((_, i) => (
                <button
                  key={i}
                  aria-label={`Cell ${i + 1}`}
                  className={`
                    w-32 h-32 rounded-xl transition-all duration-150 text-2xl font-bold
                    ${cellColor(i)}
                    ${phase === "input" ? "active:scale-95 cursor-pointer" : "cursor-default"}
                  `}
                  onClick={() => handleCellTap(i)}
                  disabled={phase !== "input"}
                />
              ))}
            </div>

            {phase === "ready" && (
              <button
                className="px-8 py-4 rounded-full bg-[var(--color-primary)] text-black font-black text-lg"
                onClick={handleStart}
              >
                START
              </button>
            )}

            {phase === "done" && (
              <p className="text-xl font-bold text-[var(--color-success)]">完了！ {reached} 段到達</p>
            )}
          </div>
        );
      }}
    </GameShell>
  );
}
