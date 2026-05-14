"use client";

/**
 * FLASH SENSE — 何個あった？
 * ドットが 800ms だけ表示される。数えるな、感じろ。
 *
 * OD 軸の測定:
 *   D (Dreamer) = 直感的な数量把握 → 素早く・正確に選べる
 *   O (Observer) = 逐次カウント思考 → カウントしようとして精度が下がる
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { GameResult } from "@/lib/types";
import { SE } from "@/lib/sound";
import { GameShell } from "./GameShell";

interface Props {
  onComplete: (result: GameResult) => void;
}

interface Dot { x: number; y: number }

// ── 定数 ──────────────────────────────────────────────────────────────────────
const ROUNDS       = 8;
const SHOW_MS      = 800;   // ドット表示時間
const PREP_MS      = 700;   // 準備表示時間
const FEEDBACK_MS  = 500;   // 正誤フィードバック表示時間
const DOT_R        = 7;     // ドット半径 (px)
const MIN_DIST     = 22;    // ドット間最小距離 (px)
const W = 300, H = 210;     // ドットエリアサイズ

// ── ユーティリティ ────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function generateDots(count: number): Dot[] {
  const dots: Dot[] = [];
  const margin = DOT_R + 4;
  let attempts = 0;
  while (dots.length < count && attempts < count * 40) {
    attempts++;
    const x = margin + Math.random() * (W - margin * 2);
    const y = margin + Math.random() * (H - margin * 2);
    if (dots.every((d) => Math.hypot(d.x - x, d.y - y) >= MIN_DIST)) {
      dots.push({ x, y });
    }
  }
  return dots;
}

function makeChoices(actual: number): number[] {
  // Distractor distances: ~18%, ~32%, ~48% of actual (scaled so not too close)
  const seen = new Set([actual]);
  const result = [actual];
  const dist = [
    Math.max(2, Math.round(actual * 0.18)),
    Math.max(3, Math.round(actual * 0.32)),
    Math.max(4, Math.round(actual * 0.48)),
  ];
  const signs = [1, -1, 1, -1];
  let di = 0;
  for (const d of dist) {
    for (const sign of signs) {
      const cand = Math.max(1, actual + sign * d);
      if (!seen.has(cand)) { seen.add(cand); result.push(cand); break; }
    }
    di++;
    if (result.length >= 4) break;
  }
  // Emergency fallback
  let off = 1;
  while (result.length < 4) {
    if (!seen.has(actual + off)) { result.push(actual + off); seen.add(actual + off); }
    off++;
  }
  return result.sort(() => Math.random() - 0.5);
}

// ── コンポーネント ────────────────────────────────────────────────────────────

type Phase = "ready" | "prep" | "showing" | "choosing" | "feedback" | "done";

export function PatternPredictor({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [round, setRound] = useState(0);
  const [dots, setDots] = useState<Dot[]>([]);
  const [actual, setActual] = useState(0);
  const [choices, setChoices] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const recordsRef = useRef<{ accuracy: number; responseMs: number }[]>([]);
  const choiceStartRef = useRef(0);

  const startRound = useCallback((idx: number) => {
    // Counts ramp up slightly: 8-15 early, 12-27 later
    const base = idx < 3 ? 8 : idx < 6 ? 11 : 14;
    const count = base + Math.floor(Math.random() * 14);
    setActual(count);
    setDots(generateDots(count));
    setChoices(makeChoices(count));
    setSelected(null);
    setRound(idx);
    setPhase("prep");

    const t1 = setTimeout(() => {
      setPhase("showing");
      const t2 = setTimeout(() => {
        setPhase("choosing");
        choiceStartRef.current = performance.now();
      }, SHOW_MS);
      return () => clearTimeout(t2);
    }, PREP_MS);
    return () => clearTimeout(t1);
  }, []);

  const handleChoose = useCallback((val: number) => {
    if (phase !== "choosing") return;
    const responseMs = performance.now() - choiceStartRef.current;
    const acc = Math.max(0, 1 - Math.abs(val - actual) / actual);
    val === actual ? SE.success() : SE.fail();
    setSelected(val);
    recordsRef.current.push({ accuracy: acc, responseMs });
    setPhase("feedback");

    setTimeout(() => {
      const next = round + 1;
      if (next >= ROUNDS) {
        setPhase("done");
        const recs = recordsRef.current;
        const avgAcc = recs.reduce((s, r) => s + r.accuracy, 0) / recs.length;
        const avgMs  = recs.reduce((s, r) => s + r.responseMs, 0) / recs.length;
        const score  = Math.round(avgAcc * 100);
        // D = high accuracy + fast response (ゲシュタルト直感)
        // O = lower accuracy (カウントしようとして失敗) or slow
        const speedFactor = clamp(1 - avgMs / 8000, 0, 1);
        const odDelta = Math.round(clamp(-(avgAcc * speedFactor * 50 - 5), -50, 50));
        setTimeout(() => onComplete({
          gameId: "pattern-predictor",
          score,
          durationMs: 0,
          rawData: { avgAccuracy: Math.round(avgAcc * 100), avgResponseMs: Math.round(avgMs) },
          axisDeltas: { OD: odDelta },
        }), 350);
      } else {
        startRound(next);
      }
    }, FEEDBACK_MS);
  }, [phase, actual, round, startRound, onComplete]);

  // Keyboard 1-4
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const n = parseInt(e.key);
      if (n >= 1 && n <= 4 && phase === "choosing") handleChoose(choices[n - 1]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleChoose, phase, choices]);

  return (
    <GameShell onRestart={() => { setPhase("ready"); recordsRef.current = []; }}>
      {() => (
        <div className="flex flex-col items-center justify-center min-h-screen gap-7 px-4">

          {/* ── Ready ── */}
          {phase === "ready" && (
            <div className="text-center space-y-5">
              <p className="text-xl font-bold">何個あった？</p>
              <p className="text-sm text-[var(--color-muted)] max-w-xs leading-relaxed">
                ドットが一瞬だけ表示される。<br/>
                <span className="text-white">数えようとするな。感じろ。</span><br/>
                全 {ROUNDS} 問。
              </p>
              <button
                className="px-8 py-4 rounded-full bg-[var(--color-primary)] text-black font-black"
                onClick={() => startRound(0)}
              >
                START
              </button>
            </div>
          )}

          {/* ── In-game ── */}
          {phase !== "ready" && phase !== "done" && (
            <>
              <p className="text-xs text-[var(--color-muted)] tracking-widest">
                ROUND {round + 1} / {ROUNDS}
              </p>

              {/* Dot area */}
              <div
                className="relative rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden"
                style={{ width: W, height: H }}
                aria-label="Dot display area"
              >
                {phase === "prep" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-[var(--color-muted)] text-sm tracking-[0.3em]">準備…</p>
                  </div>
                )}

                {phase === "showing" && dots.map((d, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full bg-[var(--color-primary)]"
                    style={{
                      width:  DOT_R * 2,
                      height: DOT_R * 2,
                      left:   d.x - DOT_R,
                      top:    d.y - DOT_R,
                    }}
                  />
                ))}

                {(phase === "choosing" || phase === "feedback") && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-4xl text-[var(--color-border)]">?</p>
                  </div>
                )}
              </div>

              {/* Choices */}
              {(phase === "choosing" || phase === "feedback") && (
                <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                  {choices.map((val, i) => {
                    const isActual   = val === actual;
                    const isSelected = val === selected;
                    let extra = "";
                    if (phase === "feedback") {
                      if (isActual)              extra = "border-[var(--color-success)] text-[var(--color-success)]";
                      else if (isSelected)       extra = "border-[var(--color-warning)] text-[var(--color-warning)]";
                    }
                    return (
                      <button
                        key={i}
                        aria-label={`Option ${i + 1}: ${val}`}
                        className={`
                          card h-16 text-2xl font-black tabular-nums transition-all
                          ${phase === "choosing" ? "hover:border-[var(--color-primary)] active:scale-95 cursor-pointer" : "cursor-default"}
                          ${extra}
                        `}
                        onClick={() => handleChoose(val)}
                        disabled={phase === "feedback"}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Feedback label */}
              {phase === "feedback" && (
                <p className={`text-sm font-bold ${selected === actual ? "text-[var(--color-success)]" : "text-[var(--color-warning)]"}`}>
                  {selected === actual ? `正解！ ${actual} 個` : `正解は ${actual} 個`}
                </p>
              )}
            </>
          )}

          {phase === "done" && (
            <p className="text-xl font-bold text-[var(--color-success)]">完了！</p>
          )}
        </div>
      )}
    </GameShell>
  );
}
