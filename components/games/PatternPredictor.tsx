"use client";

/**
 * ODD ONE OUT — どれが仲間外れ？
 * 4 アイテムの中から 1 つ違うものを選ぶ直感クイズ。
 * 速く正確に選べるほど Dreamer (D) 側になる。
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { scorePatternPredictor } from "@/lib/scoring";
import type { GameResult } from "@/lib/types";
import { SE } from "@/lib/sound";
import { GameShell } from "./GameShell";

interface Props {
  onComplete: (result: GameResult) => void;
}

interface OddQuestion {
  items: [string, string, string, string];
  oddIndex: number;
}

const QUESTIONS: OddQuestion[] = [
  { items: ["🍎", "🍊", "🍋", "🚀"], oddIndex: 3 },  // fruits vs rocket
  { items: ["🐱", "🐶", "🦁", "🐠"], oddIndex: 3 },  // land animals vs fish
  { items: ["🌙", "🌙", "⭐", "🌙"], oddIndex: 2 },  // 3 moons, 1 star
  { items: ["2",  "4",  "6",  "7" ], oddIndex: 3 },  // even vs odd number
  { items: ["🔴", "🔴", "🔵", "🔴"], oddIndex: 2 },  // 3 red, 1 blue
  { items: ["↑",  "↑",  "→",  "↑" ], oddIndex: 2 },  // direction
  { items: ["🍕", "🍔", "🌮", "🎂"], oddIndex: 3 },  // savory vs dessert
  { items: ["🎸", "🎹", "🎺", "🖥️"], oddIndex: 3 },  // instruments vs PC
  { items: ["10", "20", "30", "45"], oddIndex: 3 },  // multiples of 10
  { items: ["🌸", "🌺", "🌻", "🐚"], oddIndex: 3 },  // flowers vs shell
];

export function PatternPredictor({ onComplete }: Props) {
  const [qIdx, setQIdx] = useState(-1); // -1 = ready
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const recordsRef = useRef<{ correct: boolean; ms: number }[]>([]);
  const qStartRef = useRef(0);

  const q = QUESTIONS[qIdx];

  const finalize = useCallback(() => {
    const records = recordsRef.current;
    const correct = records.filter((r) => r.correct).length;
    const avgMs = records.length
      ? records.reduce((a, b) => a + b.ms, 0) / records.length
      : 5000;
    const { score, axisDeltas } = scorePatternPredictor({ correct, avgMs });
    setTimeout(() => onComplete({
      gameId: "pattern-predictor",
      score,
      durationMs: 0,
      rawData: { correct, total: QUESTIONS.length, avgMs: Math.round(avgMs) },
      axisDeltas,
    }), 300);
  }, [onComplete]);

  const answer = useCallback((idx: number) => {
    if (feedback || qIdx < 0) return;
    const ms = performance.now() - qStartRef.current;
    const isCorrect = idx === q.oddIndex;
    isCorrect ? SE.success() : SE.fail();
    setFeedback(isCorrect ? "correct" : "wrong");
    recordsRef.current.push({ correct: isCorrect, ms });
    setTimeout(() => {
      if (qIdx + 1 >= QUESTIONS.length) {
        finalize();
      } else {
        setQIdx((i) => i + 1);
        setFeedback(null);
        qStartRef.current = performance.now();
      }
    }, 550);
  }, [feedback, qIdx, q, finalize]);

  // Keyboard 1-4
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const n = parseInt(e.key);
      if (n >= 1 && n <= 4) answer(n - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [answer]);

  const handleStart = () => {
    recordsRef.current = [];
    setQIdx(0);
    setFeedback(null);
    qStartRef.current = performance.now();
  };

  return (
    <GameShell onRestart={() => { setQIdx(-1); setFeedback(null); }}>
      {() => (
        <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-6">
          {qIdx < 0 ? (
            <div className="text-center space-y-4">
              <p className="text-xl font-bold">仲間外れはどれ？</p>
              <p className="text-sm text-[var(--color-muted)]">
                4 つの中から 1 つだけ違うものをタップせよ。全 10 問。
              </p>
              <button
                className="px-8 py-4 rounded-full bg-[var(--color-primary)] text-black font-black"
                onClick={handleStart}
              >
                START
              </button>
            </div>
          ) : (
            <>
              {/* Progress */}
              <p className="text-xs text-[var(--color-muted)] tracking-widest">
                {qIdx + 1} / {QUESTIONS.length}
              </p>

              {/* 2×2 Grid */}
              <div className="grid grid-cols-2 gap-5 w-full max-w-xs">
                {q.items.map((item, i) => {
                  let border = "border-[var(--color-border)]";
                  if (feedback) {
                    if (i === q.oddIndex) border = "border-[var(--color-success)]";
                    else if (feedback === "wrong") border = "";
                  }
                  return (
                    <button
                      key={i}
                      aria-label={`Option ${i + 1}: ${item}`}
                      className={`
                        h-28 rounded-2xl card flex items-center justify-center
                        text-4xl transition-all
                        ${feedback ? "cursor-default" : "hover:border-zinc-400 active:scale-95"}
                        ${border}
                      `}
                      onClick={() => answer(i)}
                      disabled={!!feedback}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              {feedback && (
                <p className={`text-lg font-bold ${feedback === "correct" ? "text-[var(--color-success)]" : "text-[var(--color-warning)]"}`}>
                  {feedback === "correct" ? "正解！" : "残念…"}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </GameShell>
  );
}
