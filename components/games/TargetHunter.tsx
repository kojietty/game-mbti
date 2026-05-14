"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { scoreTargetHunter } from "@/lib/scoring";
import type { GameResult } from "@/lib/types";
import { SE } from "@/lib/sound";
import { GameShell } from "./GameShell";

interface Props {
  onComplete: (result: GameResult) => void;
}

interface Target {
  id: string;
  x: number;   // viewport %
  y: number;
  isFake: boolean;
  sizePx: number;
}

interface DifficultyParams {
  spawnMin: number;
  spawnMax: number;
  targetSize: number; // px
  fakeChance: number; // 0-1
}

function getDifficulty(elapsedMs: number): DifficultyParams {
  const t = elapsedMs / 30_000; // 0 → 1
  if (t < 0.33) {
    // Phase 1: Easy
    return { spawnMin: 1200, spawnMax: 1800, targetSize: 60, fakeChance: 0.1 };
  } else if (t < 0.66) {
    // Phase 2: Medium
    return { spawnMin: 850, spawnMax: 1300, targetSize: 50, fakeChance: 0.22 };
  } else {
    // Phase 3: Hard
    return { spawnMin: 550, spawnMax: 950, targetSize: 40, fakeChance: 0.35 };
  }
}

const DURATION_MS = 30_000;
const TARGET_LIFE_MS = 1100;

export function TargetHunter({ onComplete }: Props) {
  const [phase, setPhase] = useState<"ready" | "playing" | "done">("ready");
  const [targets, setTargets] = useState<Target[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [phaseLabel, setPhaseLabel] = useState("");
  const statsRef = useRef({ hits: 0, fakeHits: 0, spawned: 0 });
  const pausedRef = useRef(false);
  const startRef = useRef(0);
  const spawnRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishedRef = useRef(false);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearTimeout(spawnRef.current!);
    clearInterval(tickRef.current!);
    setPhase("done");
    const { hits, fakeHits, spawned } = statsRef.current;
    const total = hits + fakeHits;
    const accuracy = total > 0 ? hits / total : 1;
    const { score, axisDeltas } = scoreTargetHunter({ hits, total: spawned, accuracy });
    setTimeout(() => onComplete({
      gameId: "target-hunter",
      score,
      durationMs: DURATION_MS,
      rawData: { hits, fakeHits, spawned, accuracy: Math.round(accuracy * 100) },
      axisDeltas,
    }), 500);
  }, [onComplete]);

  const spawnTarget = useCallback(() => {
    if (pausedRef.current || finishedRef.current) return;
    const elapsed = Date.now() - startRef.current;
    const diff = getDifficulty(elapsed);
    const isFake = Math.random() < diff.fakeChance;
    const t: Target = {
      id: crypto.randomUUID(),
      x: 8 + Math.random() * 84,
      y: 18 + Math.random() * 68,
      isFake,
      sizePx: diff.targetSize,
    };
    statsRef.current.spawned++;
    setTargets((prev) => [...prev, t]);
    setTimeout(() => setTargets((prev) => prev.filter((x) => x.id !== t.id)), TARGET_LIFE_MS);
    const delay = diff.spawnMin + Math.random() * (diff.spawnMax - diff.spawnMin);
    spawnRef.current = setTimeout(spawnTarget, delay);
  }, []);

  const startGame = useCallback(() => {
    finishedRef.current = false;
    statsRef.current = { hits: 0, fakeHits: 0, spawned: 0 };
    startRef.current = Date.now();
    setPhase("playing");
    setTargets([]);
    setTimeLeft(30);
    setPhaseLabel("EASY");
    spawnTarget();
    tickRef.current = setInterval(() => {
      if (pausedRef.current) return;
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, Math.ceil((DURATION_MS - elapsed) / 1000));
      setTimeLeft(remaining);
      // Phase label
      if (elapsed < 10_000) setPhaseLabel("EASY");
      else if (elapsed < 20_000) setPhaseLabel("NORMAL");
      else setPhaseLabel("HARD");
      if (elapsed >= DURATION_MS) finish();
    }, 200);
  }, [spawnTarget, finish]);

  useEffect(() => () => {
    clearTimeout(spawnRef.current!);
    clearInterval(tickRef.current!);
  }, []);

  const tapTarget = (t: Target) => {
    setTargets((prev) => prev.filter((x) => x.id !== t.id));
    if (t.isFake) {
      SE.fail();
      statsRef.current.fakeHits++;
    } else {
      SE.success();
      statsRef.current.hits++;
    }
  };

  const handleRestart = () => {
    clearTimeout(spawnRef.current!);
    clearInterval(tickRef.current!);
    finishedRef.current = false;
    setPhase("ready");
    setTargets([]);
  };

  const phaseLabelColor =
    phaseLabel === "EASY" ? "text-[var(--color-success)]" :
    phaseLabel === "NORMAL" ? "text-[var(--color-primary)]" :
    "text-[var(--color-warning)]";

  return (
    <GameShell onRestart={handleRestart}>
      {(paused) => {
        pausedRef.current = paused;
        return (
          <div className="fixed inset-0 bg-[var(--color-base)] select-none overflow-hidden">
            {phase === "ready" && (
              <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-6">
                <p className="text-2xl font-bold">ターゲットを叩け</p>
                <div className="space-y-1 text-sm text-[var(--color-muted)]">
                  <p>● をタップ / ✕ (フェイク) は避けろ</p>
                  <p>時間が経つほど速く・小さく・フェイクが増える</p>
                </div>
                <button
                  className="px-8 py-4 rounded-full bg-[var(--color-primary)] text-black font-black text-lg"
                  onClick={startGame}
                >
                  START
                </button>
              </div>
            )}

            {phase === "playing" && (
              <>
                {/* HUD */}
                <div className="absolute top-4 left-0 right-0 flex justify-center items-center gap-6 text-sm font-mono z-10 pointer-events-none">
                  <span className="text-[var(--color-primary)]">HITS: {statsRef.current.hits}</span>
                  <span className={`font-bold ${phaseLabelColor}`}>{phaseLabel}</span>
                  <span className={timeLeft <= 5 ? "text-[var(--color-warning)] font-bold" : "text-white"}>
                    {timeLeft}s
                  </span>
                </div>

                {/* Targets */}
                {targets.map((t) => (
                  <button
                    key={t.id}
                    aria-label={t.isFake ? "Fake — avoid" : "Target — tap!"}
                    className={`
                      absolute rounded-full flex items-center justify-center
                      font-black transition-transform active:scale-90 focus:outline-none
                      ${t.isFake
                        ? "bg-[var(--color-warning)] text-black"
                        : "bg-[var(--color-primary)] text-black"}
                    `}
                    style={{
                      width: t.sizePx,
                      height: t.sizePx,
                      fontSize: t.sizePx * 0.45,
                      left: `${t.x}%`,
                      top: `${t.y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    onClick={() => tapTarget(t)}
                  >
                    {t.isFake ? "✕" : "●"}
                  </button>
                ))}
              </>
            )}

            {phase === "done" && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <p className="text-2xl font-bold text-[var(--color-success)]">完了！</p>
                <p className="text-lg font-mono">{statsRef.current.hits} hits</p>
              </div>
            )}
          </div>
        );
      }}
    </GameShell>
  );
}
