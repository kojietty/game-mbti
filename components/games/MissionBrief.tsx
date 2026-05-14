"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { scoreMissionBrief } from "@/lib/scoring";
import type { GameResult } from "@/lib/types";
import { SE } from "@/lib/sound";
import { GameShell } from "./GameShell";

interface Props {
  onComplete: (result: GameResult) => void;
}

interface Question {
  text: string;
  options: [string, string, string];
  answer: 0 | 1 | 2;
}

interface Report {
  report: string;
  questions: [Question, Question, Question];
}

const READ_TIME_MS = 5500;
const Q_TIME_SEC = 8;

const REPORTS: Report[] = [
  {
    report: "北廊下の偵察が完了した。毒沼が 2 か所、弓兵が 3 体確認された。左の扉は施錠済みで、鍵は東の宝箱の中にある。次の巡回まで残り 5 分。",
    questions: [
      { text: "弓兵は何体いた？", options: ["2 体", "3 体", "4 体"], answer: 1 },
      { text: "鍵はどこにあった？", options: ["西の宝箱", "東の宝箱", "巡回兵が持っている"], answer: 1 },
      { text: "次の巡回まで残り何分？", options: ["3 分", "4 分", "5 分"], answer: 2 },
    ],
  },
  {
    report: "装備の補充が終わった。回復薬が 8 本、エーテルが 3 本、矢が 50 本ある。盾は修理中でまだ使えない。赤い鎧を持つ敵が新たに 2 体確認された。",
    questions: [
      { text: "回復薬は何本あった？", options: ["6 本", "7 本", "8 本"], answer: 2 },
      { text: "使えない装備は？", options: ["剣", "盾", "兜"], answer: 1 },
      { text: "赤い鎧の敵は何体？", options: ["1 体", "2 体", "3 体"], answer: 1 },
    ],
  },
  {
    report: "第一波を撃退した。被害は HP の 30% 減、MP は 60% 残っている。倒した敵からルビーを 1 個獲得。次の波は 90 秒後に来る。",
    questions: [
      { text: "MP はどれくらい残っている？", options: ["40%", "60%", "70%"], answer: 1 },
      { text: "獲得したアイテムは？", options: ["サファイア", "エメラルド", "ルビー"], answer: 2 },
      { text: "次の波は何秒後？", options: ["60 秒", "90 秒", "120 秒"], answer: 1 },
    ],
  },
  {
    report: "ギルドに新メンバーが 2 人加入した。ベルナールという剣士と、リアという魔法使いだ。現在の総メンバー数は 15 人。月例ランキングは現在 7 位。",
    questions: [
      { text: "新メンバーは何人？", options: ["1 人", "2 人", "3 人"], answer: 1 },
      { text: "魔法使いの名前は？", options: ["ベルナール", "リア", "クロード"], answer: 1 },
      { text: "現在のランキングは何位？", options: ["5 位", "6 位", "7 位"], answer: 2 },
    ],
  },
  {
    report: "ボス部屋の分析が完了した。ボスは炎属性で、水属性の攻撃が有効。弱点の核は体の左側にある。HP は約 3000 で、残り 1000 で怒り状態になる。",
    questions: [
      { text: "ボスの属性は？", options: ["水", "炎", "雷"], answer: 1 },
      { text: "弱点はどこ？", options: ["右側", "中央", "左側"], answer: 2 },
      { text: "怒り状態になるのは HP が何を切ったとき？", options: ["500", "1000", "1500"], answer: 1 },
    ],
  },
];

type Phase = "ready" | "reading" | "quiz" | "done";

export function MissionBrief({ onComplete }: Props) {
  const [reportIdx, setReportIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("ready");
  const [qIdx, setQIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(Q_TIME_SEC);
  const [selected, setSelected] = useState<number | null>(null);
  const [readTimeLeft, setReadTimeLeft] = useState(READ_TIME_MS / 1000);
  const answers = useRef<{ correct: boolean; responseMs: number }[]>([]);
  const qStartRef = useRef(0);

  const currentReport = REPORTS[reportIdx];
  const currentQ = currentReport.questions[qIdx];

  const finalize = useCallback(() => {
    const recs = answers.current;
    const correct = recs.filter((a) => a.correct).length;
    const total = recs.length;
    const { score, axisDeltas } = scoreMissionBrief({ answers: recs });
    setTimeout(() => onComplete({
      gameId: "mission-brief",
      score,
      durationMs: 0,
      rawData: { correct, total },
      axisDeltas,
    }), 400);
  }, [onComplete]);

  const advanceQ = useCallback((sel: number | null) => {
    const responseMs = performance.now() - qStartRef.current;
    const correct = sel === currentQ.answer;
    sel !== null && (correct ? SE.success() : SE.fail());
    answers.current.push({ correct, responseMs: Math.min(responseMs, Q_TIME_SEC * 1000) });
    setSelected(sel);

    setTimeout(() => {
      const nextQ = qIdx + 1;
      if (nextQ >= 3) {
        const nextReport = reportIdx + 1;
        if (nextReport >= REPORTS.length) {
          setPhase("done");
          finalize();
        } else {
          setReportIdx(nextReport);
          setQIdx(0);
          setSelected(null);
          setReadTimeLeft(READ_TIME_MS / 1000);
          setPhase("reading");
        }
      } else {
        setQIdx(nextQ);
        setSelected(null);
        setTimeLeft(Q_TIME_SEC);
        qStartRef.current = performance.now();
      }
    }, 500);
  }, [qIdx, reportIdx, currentQ, finalize]);

  // Reading countdown
  useEffect(() => {
    if (phase !== "reading") return;
    const id = setInterval(() => {
      setReadTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          setPhase("quiz");
          setQIdx(0);
          setSelected(null);
          setTimeLeft(Q_TIME_SEC);
          qStartRef.current = performance.now();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, reportIdx]);

  // Question timer
  useEffect(() => {
    if (phase !== "quiz" || selected !== null) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          advanceQ(null); // timeout = wrong
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, qIdx, selected, advanceQ]);

  // Keyboard 1-3
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const n = parseInt(e.key);
      if (n >= 1 && n <= 3 && phase === "quiz" && selected === null) advanceQ(n - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [advanceQ, phase, selected]);

  const startGame = () => {
    answers.current = [];
    setReportIdx(0);
    setQIdx(0);
    setSelected(null);
    setReadTimeLeft(READ_TIME_MS / 1000);
    setPhase("reading");
  };

  return (
    <GameShell onRestart={() => { setPhase("ready"); answers.current = []; }}>
      {() => (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4 py-8">
          {phase === "ready" && (
            <div className="text-center space-y-4">
              <p className="text-xl font-bold">報告を正確に読み取れ</p>
              <p className="text-sm text-[var(--color-muted)] max-w-xs leading-relaxed">
                味方からの報告が数秒間だけ表示される。読んだ後、詳細について質問に答えよ。5 ラウンド。
              </p>
              <button
                className="px-8 py-4 rounded-full bg-[var(--color-primary)] text-black font-black"
                onClick={startGame}
              >
                START
              </button>
            </div>
          )}

          {phase === "reading" && (
            <div className="w-full max-w-sm space-y-4 text-center">
              <p className="text-xs text-[var(--color-muted)] tracking-widest">
                REPORT {reportIdx + 1} / {REPORTS.length} — {readTimeLeft}s
              </p>
              <div className="card px-6 py-5">
                <p className="text-sm leading-relaxed text-white text-left">
                  {currentReport.report}
                </p>
              </div>
              <div className="h-1 w-full bg-[var(--color-border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-warning)] transition-all duration-1000"
                  style={{ width: `${(readTimeLeft / (READ_TIME_MS / 1000)) * 100}%` }}
                />
              </div>
              <p className="text-xs text-[var(--color-muted)]">よく読め…</p>
            </div>
          )}

          {phase === "quiz" && (
            <div className="w-full max-w-sm space-y-5">
              <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
                <span>Q {reportIdx * 3 + qIdx + 1} / {REPORTS.length * 3}</span>
                <span className={timeLeft <= 3 ? "text-[var(--color-warning)] font-bold" : ""}>{timeLeft}s</span>
              </div>

              <div className="card px-5 py-4">
                <p className="text-sm font-bold">{currentQ.text}</p>
              </div>

              <div className="flex flex-col gap-3">
                {currentQ.options.map((opt, i) => {
                  let border = "";
                  if (selected !== null) {
                    if (i === currentQ.answer) border = "border-[var(--color-success)]";
                    else if (i === selected) border = "border-[var(--color-warning)]";
                  }
                  return (
                    <button
                      key={i}
                      className={`card px-4 py-3 text-sm text-left transition-all active:scale-95 ${border} ${selected === null ? "hover:border-zinc-400" : "cursor-default"}`}
                      onClick={() => selected === null && advanceQ(i)}
                      disabled={selected !== null}
                    >
                      <span className="text-[var(--color-muted)] mr-2 font-mono text-xs">{i + 1}</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {phase === "done" && (
            <p className="text-xl font-bold text-[var(--color-success)]">完了！</p>
          )}
        </div>
      )}
    </GameShell>
  );
}
