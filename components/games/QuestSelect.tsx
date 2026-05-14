"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { scoreQuestSelect } from "@/lib/scoring";
import type { GameResult } from "@/lib/types";
import { SE } from "@/lib/sound";
import { GameShell } from "./GameShell";

interface Props {
  onComplete: (result: GameResult) => void;
}

interface Quest {
  id: string;
  name: string;
  turns: number;
  reward: number;
}

const BUDGET = 10;
const TIME_LIMIT_SEC = 30;

const QUESTS: Quest[] = [
  { id: "A", name: "廃坑の探索",     turns: 3, reward: 180 },
  { id: "B", name: "盗賊の討伐",     turns: 2, reward: 130 },
  { id: "C", name: "薬草の採集",     turns: 1, reward: 70  },
  { id: "D", name: "迷宮の攻略",     turns: 4, reward: 220 },
  { id: "E", name: "ドラゴン討伐",   turns: 5, reward: 310 },
  { id: "F", name: "遺跡の調査",     turns: 3, reward: 170 },
];

function computeOptimal(quests: Quest[], budget: number): number {
  let best = 0;
  for (let mask = 0; mask < (1 << quests.length); mask++) {
    let turns = 0, reward = 0;
    for (let i = 0; i < quests.length; i++) {
      if (mask & (1 << i)) { turns += quests[i].turns; reward += quests[i].reward; }
    }
    if (turns <= budget && reward > best) best = reward;
  }
  return best;
}

const OPTIMAL = computeOptimal(QUESTS, BUDGET);

export function QuestSelect({ onComplete }: Props) {
  const [phase, setPhase] = useState<"ready" | "selecting" | "done">("ready");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SEC);
  const startRef = useRef(0);

  const turnsCost = QUESTS.filter((q) => selected.has(q.id)).reduce((s, q) => s + q.turns, 0);
  const totalReward = QUESTS.filter((q) => selected.has(q.id)).reduce((s, q) => s + q.reward, 0);
  const isOver = turnsCost > BUDGET;

  const handleConfirm = useCallback(() => {
    if (isOver) return;
    SE.success();
    const decisionMs = performance.now() - startRef.current;
    const userReward = totalReward;
    const { score, axisDeltas } = scoreQuestSelect({ userReward, optimalReward: OPTIMAL, decisionMs });
    setPhase("done");
    setTimeout(() => onComplete({
      gameId: "quest-select",
      score,
      durationMs: decisionMs,
      rawData: {
        selected: Array.from(selected),
        userReward,
        optimalReward: OPTIMAL,
        efficiency: userReward / OPTIMAL,
        decisionMs: Math.round(decisionMs),
      },
      axisDeltas,
    }), 400);
  }, [isOver, totalReward, selected, onComplete]);

  // Timer
  useEffect(() => {
    if (phase !== "selecting") return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          handleConfirm();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, handleConfirm]);

  const toggle = (id: string) => {
    SE.tap();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStart = () => {
    setSelected(new Set());
    setTimeLeft(TIME_LIMIT_SEC);
    startRef.current = performance.now();
    setPhase("selecting");
  };

  return (
    <GameShell onRestart={() => { setPhase("ready"); setSelected(new Set()); }}>
      {() => (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4 py-8">
          {phase === "ready" && (
            <div className="text-center space-y-4">
              <p className="text-xl font-bold">クエストを選べ</p>
              <p className="text-sm text-[var(--color-muted)] max-w-xs leading-relaxed">
                予算は <span className="text-white font-bold">{BUDGET} ターン</span>。最大報酬になるようにクエストを選べ。{TIME_LIMIT_SEC} 秒以内に確定。
              </p>
              <button
                className="px-8 py-4 rounded-full bg-[var(--color-primary)] text-black font-black"
                onClick={handleStart}
              >
                START
              </button>
            </div>
          )}

          {phase === "selecting" && (
            <>
              {/* Timer + budget */}
              <div className="flex items-center justify-between w-full max-w-sm text-xs font-mono">
                <span className={`font-bold ${isOver ? "text-[var(--color-warning)]" : "text-[var(--color-primary)]"}`}>
                  {turnsCost} / {BUDGET} ターン
                </span>
                <span className={`font-bold ${timeLeft <= 10 ? "text-[var(--color-warning)]" : "text-[var(--color-muted)]"}`}>
                  {timeLeft}s
                </span>
                <span className="text-[var(--color-success)] font-bold">{totalReward} G</span>
              </div>

              {/* Quest list */}
              <div className="w-full max-w-sm space-y-2">
                {QUESTS.map((q) => {
                  const isSel = selected.has(q.id);
                  return (
                    <button
                      key={q.id}
                      onClick={() => toggle(q.id)}
                      aria-pressed={isSel}
                      className={`
                        w-full card px-4 py-3 flex items-center justify-between text-sm
                        transition-all active:scale-[0.98]
                        ${isSel ? "border-[var(--color-primary)] bg-cyan-950/20" : "hover:border-zinc-400"}
                      `}
                    >
                      <div className="flex items-center gap-3 text-left">
                        <span className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs font-black ${isSel ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-[var(--color-border)]"}`}>
                          {isSel ? "✓" : ""}
                        </span>
                        <div>
                          <p className="font-bold">{q.name}</p>
                          <p className="text-xs text-[var(--color-muted)]">{q.turns} ターン</p>
                        </div>
                      </div>
                      <span className="font-black tabular-nums text-[var(--color-primary)]">
                        {q.reward} G
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                className={`px-8 py-3 rounded-full font-black transition-all ${
                  !isOver && totalReward > 0
                    ? "bg-[var(--color-primary)] text-black active:scale-95"
                    : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] cursor-not-allowed opacity-50"
                }`}
                onClick={handleConfirm}
                disabled={isOver || totalReward === 0}
              >
                CONFIRM
              </button>
            </>
          )}

          {phase === "done" && (
            <div className="text-center space-y-2">
              <p className="text-xl font-bold text-[var(--color-success)]">完了！</p>
              <p className="text-sm text-[var(--color-muted)]">
                {totalReward} G / 最大 {OPTIMAL} G
              </p>
            </div>
          )}
        </div>
      )}
    </GameShell>
  );
}
