"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useStore } from "@/lib/store";
import { TYPE_NAMES } from "@/lib/type-code";
import { getCompat } from "@/lib/compatibility";
import { Link } from "@/i18n/navigation";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { GAME_META, GAME_ORDER } from "@/lib/game-config";

export default function ResultPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { finalResult, resetSession } = useStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  if (!hydrated) return null;
  if (!finalResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 text-center px-6">
        <p className="text-[var(--color-muted)]">結果がありません。</p>
        <Link href="/"><Button variant="ghost">ホームへ</Button></Link>
      </div>
    );
  }

  const { code, axisScores, axisConfidence, borderlineAxes, skills, perGame } = finalResult;
  const typeMeta = TYPE_NAMES[code];
  const typeName = locale === "ja" ? typeMeta.ja : typeMeta.en;
  const typeData = t.has(`types.${code}.catchphrase`) ? {
    catchphrase: t(`types.${code}.catchphrase`),
    description: t(`types.${code}.description`),
    strengths: [t(`types.${code}.strengths.0`), t(`types.${code}.strengths.1`), t(`types.${code}.strengths.2`)],
    weaknesses: [t(`types.${code}.weaknesses.0`), t(`types.${code}.weaknesses.1`)],
  } : null;

  const { bestMatch, similar } = getCompat(code);
  const bestMatchName = locale === "ja" ? TYPE_NAMES[bestMatch].ja : TYPE_NAMES[bestMatch].en;
  const similarName  = locale === "ja" ? TYPE_NAMES[similar].ja  : TYPE_NAMES[similar].en;

  const skillItems = [
    { label: "Reaction", value: skills.reaction },
    { label: "Memory",   value: skills.memory   },
    { label: "Logic",    value: skills.logic     },
    { label: "Empathy",  value: skills.empathy   },
    { label: "Planning", value: skills.planning  },
  ];

  return (
    <main className="min-h-screen px-4 py-10 flex flex-col items-center gap-10 max-w-lg mx-auto">
      {/* ── Hero Card ── */}
      <section className="card w-full p-6 text-center space-y-4">
        <p className="text-xs tracking-[0.3em] text-[var(--color-muted)]">PLAYER TYPE LAB</p>
        <p
          className="text-4xl font-black tracking-[0.4em] neon-primary"
          style={{ fontFamily: "var(--font-press-start, monospace)", fontSize: "clamp(1.2rem, 5vw, 2rem)" }}
        >
          {code}
        </p>
        <h1
          className="text-2xl sm:text-3xl font-black"
          style={{ fontFamily: "var(--font-orbitron, sans-serif)" }}
        >
          {typeName}
        </h1>
        {typeData && (
          <p className="text-[var(--color-secondary)] text-sm italic">{typeData.catchphrase}</p>
        )}
        {/* Skill mini-bars */}
        <div className="space-y-2 text-left mt-4">
          {skillItems.map(({ label, value }) => (
            <div key={label} className="flex items-center gap-3 text-xs">
              <span className="w-20 text-[var(--color-muted)]">{label}</span>
              <div className="flex-1 h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-700"
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className="w-8 text-right tabular-nums text-[var(--color-muted)]">{value}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--color-muted)]">game-mbti.pagudaruma.workers.dev</p>
      </section>

      {/* ── Borderline hint ── */}
      {borderlineAxes.length > 0 && (
        <section className="card w-full p-4 border-dashed border-[var(--color-secondary)]">
          <p className="text-xs text-[var(--color-secondary)] mb-1">もう一つの可能性</p>
          <p className="text-sm text-[var(--color-muted)]">
            {borderlineAxes.join(", ")} 軸が境界型です。
            {finalResult.altCode && (
              <> <span className="font-bold text-white">{finalResult.altCode}</span> ({locale === "ja" ? TYPE_NAMES[finalResult.altCode].ja : TYPE_NAMES[finalResult.altCode].en}) の素質も持ちます。</>
            )}
          </p>
        </section>
      )}

      {/* ── Type detail ── */}
      {typeData && (
        <section className="w-full space-y-4">
          <p className="text-sm leading-relaxed text-zinc-300">{typeData.description}</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4">
              <p className="text-xs text-[var(--color-primary)] mb-2 tracking-widest">強み</p>
              <ul className="space-y-1">
                {typeData.strengths.map((s) => (
                  <li key={s} className="text-sm text-zinc-300">✦ {s}</li>
                ))}
              </ul>
            </div>
            <div className="card p-4">
              <p className="text-xs text-[var(--color-warning)] mb-2 tracking-widest">弱み</p>
              <ul className="space-y-1">
                {typeData.weaknesses.map((w) => (
                  <li key={w} className="text-sm text-zinc-300">✦ {w}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* ── Game scores ── */}
      <section className="w-full space-y-3">
        <h2 className="text-xs tracking-[0.3em] text-[var(--color-muted)]">GAME SCORES</h2>
        {perGame.map((r) => {
          const meta = GAME_META[r.gameId];
          return (
            <div key={r.gameId} className="card px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">STAGE {meta.stageNum}</p>
                <p className="text-xs text-[var(--color-muted)]">{r.gameId.toUpperCase().replace(/-/g, " ")}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black tabular-nums text-[var(--color-primary)]">{r.score}</p>
                <p className="text-xs text-[var(--color-muted)]">{meta.formatMetric(r)}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* ── Compatibility ── */}
      <section className="w-full space-y-3">
        <h2 className="text-xs tracking-[0.3em] text-[var(--color-muted)]">COMPATIBILITY</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4 text-center">
            <p className="text-xs text-[var(--color-muted)] mb-1">Best Match</p>
            <p className="font-black text-lg text-[var(--color-primary)]">{bestMatch}</p>
            <p className="text-xs">{bestMatchName}</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-[var(--color-muted)] mb-1">Similar</p>
            <p className="font-black text-lg text-[var(--color-secondary)]">{similar}</p>
            <p className="text-xs">{similarName}</p>
          </div>
        </div>
      </section>

      {/* ── Actions ── */}
      <section className="w-full flex flex-col gap-3">
        <Button
          fullWidth
          onClick={() => {
            navigator.clipboard?.writeText(window.location.origin + `/${locale}`).catch(() => {});
            alert("URLをコピーしました！友達にシェアしよう");
          }}
        >
          友達にシェア
        </Button>
        <Button
          variant="ghost"
          fullWidth
          onClick={() => {
            resetSession();
            window.location.href = `/${locale}`;
          }}
        >
          もう一度プレイ
        </Button>
      </section>
    </main>
  );
}
