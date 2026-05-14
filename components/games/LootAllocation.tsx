"use client";

import { useState, useCallback, useRef } from "react";
import { scoreLootAllocation } from "@/lib/scoring";
import type { GameResult } from "@/lib/types";
import { SE } from "@/lib/sound";
import { GameShell } from "./GameShell";

interface Props {
  onComplete: (result: GameResult) => void;
}

interface Member {
  name: string;
  role: string;
  contribution: number; // 0-100
  context: string;
}

interface RoundDef {
  scenario: string;
  members: [Member, Member, Member, Member];
}

const TOTAL = 1000;

const ROUNDS: RoundDef[] = [
  {
    scenario: "ダンジョンクリア後の報酬分配",
    members: [
      { name: "Aria",   role: "アタッカー", contribution: 45, context: "MVP の活躍。ボス戦で決定打を出した" },
      { name: "Krause", role: "タンク",     contribution: 30, context: "安定した壁役で全員を守った" },
      { name: "Mira",   role: "ヒーラー",   contribution: 20, context: "今回は調子が悪く、スキル空振りが多かった" },
      { name: "Oz",     role: "斥候",       contribution: 5,  context: "初参加で慣れておらず、足を引っ張る場面も" },
    ],
  },
  {
    scenario: "ランキング戦報酬の分配",
    members: [
      { name: "Rex",   role: "ストラテジスト", contribution: 40, context: "戦略立案で大きく貢献。直接戦闘は少なめ" },
      { name: "Luna",  role: "スナイパー",     contribution: 35, context: "精度の高いサポートで勝利に貢献" },
      { name: "Dante", role: "アサルター",     contribution: 20, context: "突撃が裏目に出て一度全滅を招いた" },
      { name: "Ivy",   role: "サポーター",     contribution: 5,  context: "体調不良で途中から参加。気力で最後まで続けた" },
    ],
  },
  {
    scenario: "ギルドイベント報酬の分配",
    members: [
      { name: "Blaze",  role: "リーダー",   contribution: 38, context: "チームを引っ張り、作戦を完遂させた" },
      { name: "Finn",   role: "クラフター", contribution: 32, context: "装備提供で全員のスペックを底上げした" },
      { name: "Sera",   role: "ヒーラー",   contribution: 22, context: "新人で不慣れ。でも最後まで粘り強く動いた" },
      { name: "Cole",   role: "探索者",     contribution: 8,  context: "家庭の事情でログイン時間が短く、参加度が低かった" },
    ],
  },
];

export function LootAllocation({ onComplete }: Props) {
  const [phase, setPhase] = useState<"ready" | "allocating" | "done">("ready");
  const [roundIdx, setRoundIdx] = useState(0);
  const [allocs, setAllocs] = useState<number[]>([250, 250, 250, 250]);
  const roundResults = useRef<{ contributions: number[]; allocations: number[] }[]>([]);

  const round = ROUNDS[roundIdx];
  const total = allocs.reduce((s, v) => s + v, 0);
  const isValid = total === TOTAL;

  const adjust = (i: number, delta: number) => {
    SE.tap();
    setAllocs((prev) => {
      const next = [...prev];
      next[i] = Math.max(0, Math.min(TOTAL, next[i] + delta));
      return next;
    });
  };

  const handleConfirm = useCallback(() => {
    if (!isValid) return;
    SE.success();
    roundResults.current.push({
      contributions: round.members.map((m) => m.contribution),
      allocations: [...allocs],
    });

    const nextIdx = roundIdx + 1;
    if (nextIdx >= ROUNDS.length) {
      setPhase("done");
      const { score, axisDeltas } = scoreLootAllocation({ rounds: roundResults.current });
      setTimeout(() => onComplete({
        gameId: "loot-allocation",
        score,
        durationMs: 0,
        rawData: { rounds: roundResults.current },
        axisDeltas,
      }), 400);
    } else {
      setRoundIdx(nextIdx);
      setAllocs([250, 250, 250, 250]);
    }
  }, [isValid, allocs, roundIdx, round, onComplete]);

  const handleStart = () => {
    roundResults.current = [];
    setRoundIdx(0);
    setAllocs([250, 250, 250, 250]);
    setPhase("allocating");
  };

  return (
    <GameShell onRestart={() => { setPhase("ready"); roundResults.current = []; }}>
      {() => (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4 py-8">
          {phase === "ready" && (
            <div className="text-center space-y-4">
              <p className="text-xl font-bold">報酬を分配せよ</p>
              <p className="text-sm text-[var(--color-muted)] max-w-xs leading-relaxed">
                クリア後の 1000G を 4 人で分ける。合計がちょうど 1000G になったら確定できる。3 ラウンド。
              </p>
              <button
                className="px-8 py-4 rounded-full bg-[var(--color-primary)] text-black font-black"
                onClick={handleStart}
              >
                START
              </button>
            </div>
          )}

          {phase === "allocating" && (
            <>
              <div className="text-center">
                <p className="text-xs text-[var(--color-muted)] tracking-widest mb-1">
                  ROUND {roundIdx + 1} / {ROUNDS.length}
                </p>
                <p className="text-sm font-bold">{round.scenario}</p>
              </div>

              <div className="w-full max-w-sm space-y-3">
                {round.members.map((m, i) => (
                  <div key={i} className="card p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-bold text-sm">{m.name}</span>
                        <span className="ml-2 text-xs text-[var(--color-muted)]">{m.role}</span>
                      </div>
                      <span className="text-xs text-[var(--color-primary)] font-mono">
                        貢献 {m.contribution}%
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mb-3">{m.context}</p>
                    <div className="flex items-center gap-2">
                      <button
                        className="w-9 h-9 rounded card font-bold text-lg hover:border-[var(--color-warning)] active:scale-95"
                        onClick={() => adjust(i, -50)}
                      >-</button>
                      <span className="flex-1 text-center tabular-nums font-mono font-bold text-[var(--color-primary)]">
                        {allocs[i]}G
                      </span>
                      <button
                        className="w-9 h-9 rounded card font-bold text-lg hover:border-[var(--color-primary)] active:scale-95"
                        onClick={() => adjust(i, 50)}
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center space-y-3">
                <p className={`text-sm font-mono font-bold ${isValid ? "text-[var(--color-success)]" : "text-[var(--color-warning)]"}`}>
                  合計: {total} / {TOTAL} G
                </p>
                <button
                  className={`px-8 py-3 rounded-full font-black transition-all ${
                    isValid
                      ? "bg-[var(--color-primary)] text-black active:scale-95"
                      : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] cursor-not-allowed opacity-50"
                  }`}
                  onClick={handleConfirm}
                  disabled={!isValid}
                >
                  CONFIRM
                </button>
              </div>
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
