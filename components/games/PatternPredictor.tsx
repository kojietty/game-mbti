"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { scorePatternPredictor } from "@/lib/scoring";
import { QUESTIONS, shuffleChoices, type ShapeItem } from "@/lib/pattern-questions";
import type { GameResult } from "@/lib/types";
import { SE } from "@/lib/sound";
import { GameShell } from "./GameShell";

interface Props {
  onComplete: (result: GameResult) => void;
}

const TIME_PER_Q = 15;

function ShapeDisplay({ item, size = "lg" }: { item: ShapeItem; size?: "sm" | "lg" }) {
  const dim = size === "lg" ? "w-16 h-16" : "w-10 h-10";
  const colorMap: Record<string, string> = {
    cyan: "bg-cyan-400",
    fuchsia: "bg-fuchsia-300",
    green: "bg-green-400",
    orange: "bg-orange-400",
  };
  const sizeMap: Record<string, string> = {
    sm: "scale-75",
    md: "scale-100",
    lg: "scale-125",
  };

  const base = `${dim} ${colorMap[item.color]} ${sizeMap[item.size]} transition-transform`;

  if (item.shape === "circle") return <div className={`${base} rounded-full`} />;
  if (item.shape === "square") return <div className={`${base} rounded-sm`} />;
  if (item.shape === "triangle") {
    return (
      <div
        className={`${dim} ${colorMap[item.color]} ${sizeMap[item.size]}`}
        style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
      />
    );
  }
  if (item.shape === "diamond") return <div className={`${base} rotate-45`} />;
  return <div className={base} />;
}

export function PatternPredictor({ onComplete }: Props) {
  const [qIdx, setQIdx] = useState(0);
  const [choices, setChoices] = useState<ShapeItem[]>([]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [started, setStarted] = useState(false);
  const recordsRef = useRef<{ correct: boolean; ms: number }[]>([]);
  const qStartRef = useRef(0);
  const pausedRef = useRef(false);

  const q = QUESTIONS[qIdx];

  const loadQuestion = useCallback((idx: number) => {
    const { choices: c, correctIndex: ci } = shuffleChoices(QUESTIONS[idx]);
    setChoices(c);
    setCorrectIndex(ci);
    setTimeLeft(TIME_PER_Q);
    setFeedback(null);
    qStartRef.current = performance.now();
  }, []);

  const finalize = useCallback(() => {
    const records = recordsRef.current;
    const correct = records.filter((r) => r.correct).length;
    const avgMs = records.length ? records.reduce((a, b) => a + b.ms, 0) / records.length : 10000;
    const { score, axisDeltas } = scorePatternPredictor({ correct, avgMs });
    setTimeout(() => onComplete({
      gameId: "pattern-predictor",
      score,
      durationMs: 0,
      rawData: { correct, total: QUESTIONS.length, avgMs: Math.round(avgMs) },
      axisDeltas,
    }), 400);
  }, [onComplete]);

  const advance = useCallback(() => {
    if (qIdx + 1 >= QUESTIONS.length) {
      finalize();
    } else {
      const next = qIdx + 1;
      setQIdx(next);
      loadQuestion(next);
    }
  }, [qIdx, finalize, loadQuestion]);

  const answer = useCallback((idx: number) => {
    if (feedback) return;
    const ms = performance.now() - qStartRef.current;
    const isCorrect = idx === correctIndex;
    isCorrect ? SE.success() : SE.fail();
    setFeedback(isCorrect ? "correct" : "wrong");
    recordsRef.current.push({ correct: isCorrect, ms });
    setTimeout(advance, 600);
  }, [feedback, correctIndex, advance]);

  // Timer
  useEffect(() => {
    if (!started || feedback) return;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          // timeout counts as wrong
          SE.fail();
          setFeedback("wrong");
          recordsRef.current.push({ correct: false, ms: TIME_PER_Q * 1000 });
          setTimeout(advance, 600);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [qIdx, started, feedback, advance]);

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
    loadQuestion(0);
    setStarted(true);
  };

  return (
    <GameShell onRestart={() => { setStarted(false); setQIdx(0); }}>
      {(paused) => {
        pausedRef.current = paused;
        return (
          <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-6">
            {!started ? (
              <div className="text-center space-y-6">
                <p className="text-xl font-bold">次に来る図形を選べ</p>
                <p className="text-sm text-[var(--color-muted)]">10 問 / 各 {TIME_PER_Q} 秒</p>
                <button
                  className="px-8 py-4 rounded-full bg-[var(--color-primary)] text-black font-black"
                  onClick={handleStart}
                >START</button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between w-full max-w-sm">
                  <p className="text-xs text-[var(--color-muted)]">Q {qIdx + 1} / {QUESTIONS.length}</p>
                  <p className={`text-sm font-mono font-bold ${timeLeft <= 5 ? "text-[var(--color-warning)]" : "text-[var(--color-primary)]"}`}>
                    {timeLeft}s
                  </p>
                </div>

                {/* Sequence row */}
                <div className="flex items-center gap-3 flex-wrap justify-center">
                  {q.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-center w-20 h-20 card">
                      <ShapeDisplay item={item} size="sm" />
                    </div>
                  ))}
                  <div className="flex items-center justify-center w-20 h-20 card border-dashed border-[var(--color-primary)]">
                    <span className="text-[var(--color-primary)] text-2xl">?</span>
                  </div>
                </div>

                {/* Choices */}
                <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                  {choices.map((item, i) => (
                    <button
                      key={i}
                      aria-label={`Option ${i + 1}: ${item.shape} ${item.color}`}
                      className={`
                        h-20 card flex items-center justify-center text-xs font-mono
                        transition-all active:scale-95
                        ${feedback === "correct" && i === correctIndex ? "border-[var(--color-success)] bg-green-900/30" : ""}
                        ${feedback === "wrong" && i === correctIndex ? "border-[var(--color-success)]" : ""}
                        ${feedback ? "cursor-default" : "hover:border-[var(--color-primary)] cursor-pointer"}
                      `}
                      onClick={() => answer(i)}
                      disabled={!!feedback}
                    >
                      <ShapeDisplay item={item} size="sm" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      }}
    </GameShell>
  );
}
