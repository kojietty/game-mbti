"use client";

import { useState, useCallback, useEffect } from "react";
import { scoreCodeBreaker } from "@/lib/scoring";
import type { GameResult } from "@/lib/types";
import { SE } from "@/lib/sound";
import { GameShell } from "./GameShell";

interface Props {
  onComplete: (result: GameResult) => void;
}

const MAX_ATTEMPTS = 8;
const CODE_LENGTH = 4;

function generateSecret(): number[] {
  const digits = Array.from({ length: 10 }, (_, i) => i);
  const shuffled = digits.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, CODE_LENGTH);
}

function calcHitBlow(secret: number[], guess: number[]): { hits: number; blows: number } {
  let hits = 0, blows = 0;
  for (let i = 0; i < CODE_LENGTH; i++) {
    if (guess[i] === secret[i]) hits++;
    else if (secret.includes(guess[i])) blows++;
  }
  return { hits, blows };
}

interface Attempt {
  guess: number[];
  hits: number;
  blows: number;
}

export function CodeBreaker({ onComplete }: Props) {
  const [secret, setSecret] = useState<number[]>(() => generateSecret());
  const [current, setCurrent] = useState<number[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [phase, setPhase] = useState<"ready" | "playing" | "done">("ready");
  const [won, setWon] = useState(false);
  const [reductions, setReductions] = useState<number[]>([]);

  const finalize = useCallback((finalAttempts: Attempt[], solved: boolean, finalReductions: number[]) => {
    const avgReduction = finalReductions.length > 0
      ? finalReductions.reduce((a, b) => a + b, 0) / finalReductions.length
      : 0.3;
    const { score, axisDeltas } = scoreCodeBreaker({
      attempts: finalAttempts.length,
      solved,
      avgCandidateReduction: avgReduction,
    });
    setPhase("done");
    setTimeout(() => onComplete({
      gameId: "code-breaker",
      score,
      durationMs: 0,
      rawData: { attempts: finalAttempts.length, solved, secret },
      axisDeltas,
    }), 600);
  }, [onComplete, secret]);

  const submitGuess = useCallback(() => {
    if (current.length !== CODE_LENGTH) return;
    const { hits, blows } = calcHitBlow(secret, current);
    // Estimate candidate reduction (approximation)
    const reduction = hits / CODE_LENGTH + blows / (CODE_LENGTH * 2);
    const newAttempts = [...attempts, { guess: current, hits, blows }];
    const newReductions = [...reductions, reduction];
    setAttempts(newAttempts);
    setReductions(newReductions);
    setCurrent([]);

    if (hits === CODE_LENGTH) {
      SE.success();
      setWon(true);
      finalize(newAttempts, true, newReductions);
    } else if (newAttempts.length >= MAX_ATTEMPTS) {
      SE.fail();
      finalize(newAttempts, false, newReductions);
    } else {
      SE.tap();
    }
  }, [current, secret, attempts, reductions, finalize]);

  const pressDigit = (d: number) => {
    if (current.length >= CODE_LENGTH || current.includes(d)) return;
    SE.tap();
    setCurrent((c) => [...c, d]);
  };

  const backspace = () => setCurrent((c) => c.slice(0, -1));

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase !== "playing") return;
      if (e.key === "Backspace") backspace();
      if (e.key === "Enter") submitGuess();
      const d = parseInt(e.key);
      if (!isNaN(d) && d >= 0 && d <= 9) pressDigit(d);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, current, submitGuess]);

  const handleStart = () => {
    setSecret(generateSecret());
    setCurrent([]);
    setAttempts([]);
    setReductions([]);
    setWon(false);
    setPhase("playing");
  };

  return (
    <GameShell onRestart={handleStart}>
      {() => (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-6 py-8">
          {phase === "ready" && (
            <div className="text-center space-y-4">
              <p className="text-xl font-bold">4 桁の数字を当てろ</p>
              <p className="text-sm text-[var(--color-muted)]">
                ヒット=位置も一致 / ブロー=数字のみ一致<br />重複なし、{MAX_ATTEMPTS} 回まで
              </p>
              <button className="px-8 py-4 rounded-full bg-[var(--color-primary)] text-black font-black" onClick={handleStart}>
                START
              </button>
            </div>
          )}

          {(phase === "playing" || phase === "done") && (
            <>
              {/* Current input */}
              <div className="flex gap-3">
                {Array.from({ length: CODE_LENGTH }).map((_, i) => (
                  <div key={i}
                    className={`w-14 h-14 rounded-lg card flex items-center justify-center text-2xl font-black tabular-nums
                      ${current[i] != null ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "text-[var(--color-border)]"}
                    `}
                  >
                    {current[i] ?? "—"}
                  </div>
                ))}
              </div>

              {/* Attempt history */}
              <div className="w-full max-w-xs space-y-2 max-h-48 overflow-y-auto">
                {attempts.map((a, i) => (
                  <div key={i} className="flex items-center justify-between card px-3 py-2 text-sm font-mono">
                    <span className="tracking-widest">{a.guess.join(" ")}</span>
                    <span className="text-[var(--color-primary)]">H:{a.hits}</span>
                    <span className="text-[var(--color-secondary)]">B:{a.blows}</span>
                  </div>
                ))}
              </div>

              {/* Attempts left */}
              {phase === "playing" && (
                <p className="text-xs text-[var(--color-muted)]">
                  残り {MAX_ATTEMPTS - attempts.length} / {MAX_ATTEMPTS} 回
                </p>
              )}

              {phase === "done" && (
                <p className={`font-bold ${won ? "text-[var(--color-success)]" : "text-[var(--color-warning)]"}`}>
                  {won ? `${attempts.length} 回で正解！` : `答えは ${secret.join("")}`}
                </p>
              )}

              {/* Number pad */}
              {phase === "playing" && (
                <div className="grid grid-cols-5 gap-2 w-full max-w-xs">
                  {Array.from({ length: 10 }, (_, i) => (
                    <button key={i}
                      className={`h-11 rounded-lg font-bold text-lg card transition-colors
                        ${current.includes(i) ? "opacity-30 cursor-not-allowed" : "hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] active:scale-95"}
                      `}
                      onClick={() => pressDigit(i)}
                      disabled={current.includes(i)}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              )}

              {phase === "playing" && (
                <div className="flex gap-3 w-full max-w-xs">
                  <button
                    className="flex-1 h-11 card rounded-lg font-bold text-[var(--color-warning)] hover:border-[var(--color-warning)] active:scale-95"
                    onClick={backspace}
                  >
                    ← 削除
                  </button>
                  <button
                    className={`flex-1 h-11 rounded-lg font-black transition-all active:scale-95
                      ${current.length === CODE_LENGTH
                        ? "bg-[var(--color-primary)] text-black"
                        : "card opacity-40 cursor-not-allowed"}
                    `}
                    onClick={submitGuess}
                    disabled={current.length !== CODE_LENGTH}
                  >
                    CHECK
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </GameShell>
  );
}
