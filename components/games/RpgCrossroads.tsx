"use client";

import { useState, useCallback } from "react";
import { scoreRpgCrossroads } from "@/lib/scoring";
import type { GameResult } from "@/lib/types";
import { SE } from "@/lib/sound";
import { GameShell } from "./GameShell";

interface Props {
  onComplete: (result: GameResult) => void;
}

type Choice = "logic" | "heart" | "neutral";

interface Scenario {
  situation: string;
  options: [string, string, string]; // [logic, heart, neutral]
}

const SCENARIOS: Scenario[] = [
  {
    situation:
      "重要な使命の途中で、仲間が捕らえられた。救出には大幅な遅延が伴う。どうする？",
    options: ["使命を優先し、後で戻る", "すぐ救出に向かう", "偵察を送って情報を得る"],
  },
  {
    situation:
      "パーティの新人が、規則を破って傷ついた村人を匿った。ギルドからは即時報告を求められている。",
    options: ["規則通り報告する", "事情を汲んで見逃す", "新人に自首を促す"],
  },
  {
    situation:
      "高額報酬の怪しい依頼と、低額だが信頼関係を築ける村の依頼がある。",
    options: ["高額を選ぶ", "信頼を築ける依頼を選ぶ", "別の依頼を探す"],
  },
  {
    situation:
      "パーティが明らかに間違った戦略に同調している。雰囲気を壊したくないが…",
    options: ["はっきり反対する", "集団の和を保つ", "個別に説得する"],
  },
  {
    situation:
      "古い英雄の偉業が嘘だった証拠を見つけた。暴けば民の希望は失われる。",
    options: ["真実を公表する", "事実を伏せる", "関係者だけに伝える"],
  },
];

const CHOICE_TYPES: Choice[] = ["logic", "heart", "neutral"];
const CHOICE_LABELS: Record<Choice, string> = {
  logic:   "論理 (L)",
  heart:   "共感 (H)",
  neutral: "中立",
};
const CHOICE_COLORS: Record<Choice, string> = {
  logic:   "border-cyan-400 text-cyan-400",
  heart:   "border-fuchsia-300 text-fuchsia-300",
  neutral: "border-zinc-500 text-zinc-400",
};

export function RpgCrossroads({ onComplete }: Props) {
  const [scIdx, setScIdx] = useState(-1); // -1 = ready
  const [choices, setChoices] = useState<Choice[]>([]);
  const [selected, setSelected] = useState<Choice | null>(null);

  const handleSelect = useCallback((choice: Choice) => {
    if (selected) return;
    SE.tap();
    setSelected(choice);
    setTimeout(() => {
      const newChoices = [...choices, choice];
      if (scIdx + 1 >= SCENARIOS.length) {
        const logicCount = newChoices.filter((c) => c === "logic").length;
        const heartCount = newChoices.filter((c) => c === "heart").length;
        const neutralCount = newChoices.filter((c) => c === "neutral").length;
        const { score, axisDeltas } = scoreRpgCrossroads({ logicCount, heartCount, neutralCount });
        onComplete({
          gameId: "rpg-crossroads",
          score,
          durationMs: 0,
          rawData: { logicCount, heartCount, neutralCount },
          axisDeltas,
        });
      } else {
        setChoices(newChoices);
        setScIdx((i) => i + 1);
        setSelected(null);
      }
    }, 500);
  }, [selected, choices, scIdx, onComplete]);

  // Keyboard 1-3
  useState(() => {
    const handler = (e: KeyboardEvent) => {
      const n = parseInt(e.key);
      if (n >= 1 && n <= 3 && scIdx >= 0) handleSelect(CHOICE_TYPES[n - 1]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const scenario = SCENARIOS[scIdx];

  return (
    <GameShell onRestart={() => { setScIdx(-1); setChoices([]); setSelected(null); }}>
      {() => (
        <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-6 py-10">
          {scIdx < 0 ? (
            <div className="text-center space-y-4">
              <p className="text-xl font-bold">分岐点に立て</p>
              <p className="text-sm text-[var(--color-muted)]">5 つのシナリオで決断を下せ。直感に従え。</p>
              <button
                className="px-8 py-4 rounded-full bg-[var(--color-primary)] text-black font-black"
                onClick={() => setScIdx(0)}
              >START</button>
            </div>
          ) : (
            <>
              {/* Progress */}
              <p className="text-xs text-[var(--color-muted)] tracking-widest">
                SCENARIO {scIdx + 1} / {SCENARIOS.length}
              </p>

              {/* Situation */}
              <div className="card px-6 py-6 max-w-sm text-center">
                <p className="text-base leading-relaxed text-white">{scenario.situation}</p>
              </div>

              {/* Choices */}
              <div className="flex flex-col gap-3 w-full max-w-sm">
                {CHOICE_TYPES.map((ct, i) => (
                  <button
                    key={ct}
                    className={`
                      card px-5 py-4 text-left rounded-xl text-sm transition-all
                      ${selected === ct ? CHOICE_COLORS[ct] : "hover:border-zinc-400"}
                      ${selected && selected !== ct ? "opacity-40" : "active:scale-95"}
                    `}
                    onClick={() => handleSelect(ct)}
                    disabled={!!selected}
                  >
                    <span className="mr-3 font-mono text-xs text-[var(--color-muted)]">{i + 1}</span>
                    {scenario.options[i]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </GameShell>
  );
}
