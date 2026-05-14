"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { scoreQuickStop } from "@/lib/scoring";
import type { GameResult } from "@/lib/types";
import { SE } from "@/lib/sound";
import { GameShell } from "./GameShell";

interface Props {
  onComplete: (result: GameResult) => void;
}

interface Round {
  accuracy: number;
  earlyTapMs: number;
  hit: boolean;
}

const TOTAL_ROUNDS = 10;
const BAR_SPEED = 3;           // px per frame at 60fps
const CONTAINER_W = 320;
const INITIAL_ZONE_W = 90;
const MIN_ZONE_W = 28;

export function QuickStop({ onComplete }: Props) {
  const [phase, setPhase] = useState<"ready" | "playing" | "done">("ready");
  const [roundIdx, setRoundIdx] = useState(0);
  const [barX, setBarX] = useState(CONTAINER_W / 2);
  const [zoneW, setZoneW] = useState(INITIAL_ZONE_W);
  const [zoneCenter] = useState(CONTAINER_W / 2);
  const [feedback, setFeedback] = useState<"hit" | "miss" | null>(null);
  const rounds = useRef<Round[]>([]);
  const dirRef = useRef(1);
  const rafRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const inZoneRef = useRef<number | null>(null); // performance.now() when bar entered zone

  const BAR_W = 12;

  const currentZoneW = Math.max(
    MIN_ZONE_W,
    INITIAL_ZONE_W - (roundIdx / (TOTAL_ROUNDS - 1)) * (INITIAL_ZONE_W - MIN_ZONE_W)
  );
  const zoneLeft = zoneCenter - currentZoneW / 2;
  const zoneRight = zoneCenter + currentZoneW / 2;

  const advanceRound = useCallback((round: Round) => {
    rounds.current.push(round);
    const next = roundIdx + 1;
    if (next >= TOTAL_ROUNDS) {
      cancelAnimationFrame(rafRef.current);
      setPhase("done");
      const { score, axisDeltas } = scoreQuickStop({ rounds: rounds.current });
      const avgAcc = rounds.current.filter(r=>r.hit).reduce((s,r)=>s+r.accuracy,0)/Math.max(1,rounds.current.filter(r=>r.hit).length);
      setTimeout(() => onComplete({
        gameId: "quick-stop",
        score,
        durationMs: 0,
        rawData: { avgAccuracy: avgAcc, rounds: rounds.current },
        axisDeltas,
      }), 500);
    } else {
      setRoundIdx(next);
      setFeedback(null);
      inZoneRef.current = null;
    }
  }, [roundIdx, onComplete]);

  // Animation loop
  useEffect(() => {
    if (phase !== "playing" || feedback) return;
    const tick = () => {
      if (!pausedRef.current) {
        setBarX((x) => {
          const next = x + dirRef.current * BAR_SPEED;
          if (next <= 0 || next >= CONTAINER_W - BAR_W) {
            dirRef.current *= -1;
            return Math.max(0, Math.min(CONTAINER_W - BAR_W, next));
          }
          const barCenter = next + BAR_W / 2;
          const wasInZone = inZoneRef.current !== null;
          const isInZone = barCenter >= zoneLeft && barCenter <= zoneRight;
          if (!wasInZone && isInZone) inZoneRef.current = performance.now();
          if (wasInZone && !isInZone) inZoneRef.current = null;
          return next;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, feedback, zoneLeft, zoneRight]);

  const handleTap = useCallback(() => {
    if (phase !== "playing" || feedback || pausedRef.current) return;
    const barCenter = barX + BAR_W / 2;
    const hit = barCenter >= zoneLeft && barCenter <= zoneRight;

    if (hit) {
      SE.success();
      const accuracy = 1 - Math.abs(barCenter - zoneCenter) / (currentZoneW / 2);
      const earlyTapMs = inZoneRef.current != null ? performance.now() - inZoneRef.current : 0;
      setFeedback("hit");
      setTimeout(() => advanceRound({ accuracy, earlyTapMs, hit: true }), 400);
    } else {
      SE.fail();
      setFeedback("miss");
      setTimeout(() => advanceRound({ accuracy: 0, earlyTapMs: 0, hit: false }), 400);
    }
  }, [phase, feedback, barX, zoneLeft, zoneRight, zoneCenter, currentZoneW, advanceRound]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); handleTap(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleTap]);

  const handleRestart = () => {
    cancelAnimationFrame(rafRef.current);
    rounds.current = [];
    setRoundIdx(0);
    setBarX(CONTAINER_W / 2);
    setFeedback(null);
    setPhase("ready");
  };

  return (
    <GameShell onRestart={handleRestart}>
      {(paused) => {
        pausedRef.current = paused;
        return (
          <div
            className="flex flex-col items-center justify-center min-h-screen gap-8 px-6 select-none"
            onClick={phase === "playing" && !feedback ? handleTap : undefined}
            style={{ cursor: phase === "playing" && !feedback ? "pointer" : "default" }}
            aria-label={phase === "playing" ? "Tap anywhere to stop the bar" : undefined}
            role={phase === "playing" ? "button" : undefined}
          >
            {phase === "ready" && (
              <div className="text-center space-y-4">
                <p className="text-xl font-bold">バーを止めろ</p>
                <p className="text-sm text-[var(--color-muted)]">
                  緑ゾーンでタップして止める。ゾーンは段々と縮む。10 ラウンド。
                </p>
                <button
                  className="px-8 py-4 rounded-full bg-[var(--color-primary)] text-black font-black"
                  onClick={(e) => { e.stopPropagation(); setPhase("playing"); }}
                >
                  START
                </button>
              </div>
            )}

            {(phase === "playing" || phase === "done") && (
              <>
                <p className="text-xs text-[var(--color-muted)] tracking-widest">
                  ROUND {Math.min(roundIdx + 1, TOTAL_ROUNDS)} / {TOTAL_ROUNDS}
                </p>

                {/* Bar track — ビジュアルのみ、タップはフルスクリーン側で受け取る */}
                <div
                  className="relative rounded-xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)]"
                  style={{ width: CONTAINER_W, height: 80 }}
                >
                  {/* Green zone */}
                  <div
                    className="absolute top-0 h-full bg-[var(--color-success)] opacity-25 transition-all duration-300"
                    style={{ left: zoneLeft, width: currentZoneW }}
                  />
                  {/* Zone border */}
                  <div
                    className="absolute top-0 h-full border-2 border-[var(--color-success)]"
                    style={{ left: zoneLeft, width: currentZoneW }}
                  />

                  {/* Moving bar */}
                  <div
                    className={`absolute top-2 bottom-2 rounded transition-colors ${
                      feedback === "hit"
                        ? "bg-[var(--color-success)]"
                        : feedback === "miss"
                          ? "bg-[var(--color-warning)]"
                          : "bg-[var(--color-primary)]"
                    }`}
                    style={{ left: barX, width: BAR_W }}
                  />
                </div>

                {feedback && (
                  <p className={`text-lg font-bold ${feedback === "hit" ? "text-[var(--color-success)]" : "text-[var(--color-warning)]"}`}>
                    {feedback === "hit" ? "ナイス！" : "はずれ"}
                  </p>
                )}
                {!feedback && phase === "playing" && (
                  <p className="text-xs text-[var(--color-muted)]">画面のどこでもタップ / スペースキー</p>
                )}
                {phase === "done" && (
                  <p className="text-xl font-bold text-[var(--color-success)]">完了！</p>
                )}
              </>
            )}
          </div>
        );
      }}
    </GameShell>
  );
}
