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
  x: number; // viewport %
  y: number;
  isFake: boolean;
}

const DURATION_MS = 30_000;
const TARGET_LIFE_MS = 1200;
const FAKE_CHANCE = 0.2;

export function TargetHunter({ onComplete }: Props) {
  const [phase, setPhase] = useState<"ready" | "playing" | "done">("ready");
  const [targets, setTargets] = useState<Target[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
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
    const isFake = Math.random() < FAKE_CHANCE;
    const t: Target = {
      id: crypto.randomUUID(),
      x: 10 + Math.random() * 80,
      y: 15 + Math.random() * 70,
      isFake,
    };
    statsRef.current.spawned++;
    setTargets((prev) => [...prev, t]);
    setTimeout(() => setTargets((prev) => prev.filter((x) => x.id !== t.id)), TARGET_LIFE_MS);
    const delay = 800 + Math.random() * 700;
    spawnRef.current = setTimeout(spawnTarget, delay);
  }, []);

  const startGame = useCallback(() => {
    finishedRef.current = false;
    statsRef.current = { hits: 0, fakeHits: 0, spawned: 0 };
    startRef.current = Date.now();
    setPhase("playing");
    setTargets([]);
    setTimeLeft(30);
    spawnTarget();
    tickRef.current = setInterval(() => {
      if (pausedRef.current) return;
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, Math.ceil((DURATION_MS - elapsed) / 1000));
      setTimeLeft(remaining);
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

  return (
    <GameShell onRestart={handleRestart}>
      {(paused) => {
        pausedRef.current = paused;
        return (
          <div className="fixed inset-0 bg-[var(--color-base)] select-none overflow-hidden">
            {phase === "ready" && (
              <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-6">
                <p className="text-2xl font-bold">タップして開始</p>
                <p className="text-sm text-[var(--color-muted)]">出現するターゲット（●）を叩け。フェイク（×）は避けろ。</p>
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
                <div className="absolute top-4 left-0 right-0 flex justify-center gap-8 text-sm font-mono z-10">
                  <span className="text-[var(--color-primary)]">HITS: {statsRef.current.hits}</span>
                  <span className={timeLeft <= 5 ? "text-[var(--color-warning)]" : "text-white"}>
                    {timeLeft}s
                  </span>
                </div>

                {/* Targets */}
                {targets.map((t) => (
                  <button
                    key={t.id}
                    aria-label={t.isFake ? "Fake target — do not tap" : "Tap this target"}
                    className={`
                      absolute w-14 h-14 rounded-full flex items-center justify-center
                      text-2xl font-black transition-transform active:scale-95 focus:outline-none
                      ${t.isFake
                        ? "bg-[var(--color-warning)] text-black"
                        : "bg-[var(--color-primary)] text-black"
                      }
                    `}
                    style={{
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
