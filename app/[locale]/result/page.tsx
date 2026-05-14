"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useStore } from "@/lib/store";
import { TYPE_NAMES, getGameGenres } from "@/lib/type-code";
import { getCompat } from "@/lib/compatibility";
import { Link } from "@/i18n/navigation";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { GAME_META, GAME_ORDER } from "@/lib/game-config";
import type { AxisKey, TypeCode } from "@/lib/types";

// ── 4 軸のゲームスタイル説明 ─────────────────────────────────────────────────

const AXIS_STYLE: Record<AxisKey, {
  pos: { code: string; label: string; desc: string };
  neg: { code: string; label: string; desc: string };
}> = {
  VS: {
    pos: { code: "V", label: "VANGUARD",   desc: "前に出る。速さで戦況を支配する" },
    neg: { code: "S", label: "SCOUT",      desc: "観察から入る。情報優位で動く" },
  },
  OD: {
    pos: { code: "O", label: "OBSERVER",   desc: "細部を記憶。正確さを武器にする" },
    neg: { code: "D", label: "DREAMER",    desc: "パターンを直感で捉える" },
  },
  LH: {
    pos: { code: "L", label: "LOGIC",      desc: "効率と結果で判断する" },
    neg: { code: "H", label: "HEART",      desc: "チームと共感で動く" },
  },
  PI: {
    pos: { code: "P", label: "PLANNER",    desc: "計画してから実行する" },
    neg: { code: "I", label: "IMPROVISER", desc: "試しながら適応する" },
  },
};

const AXIS_ORDER: AxisKey[] = ["VS", "OD", "LH", "PI"];

// ── 全 4 軸の両側説明 ─────────────────────────────────────────────────────────

const AXIS_BOTH: Record<AxisKey, {
  axis: string;
  pos: { code: string; label: string; jp: string; detail: string };
  neg: { code: string; label: string; jp: string; detail: string };
}> = {
  VS: {
    axis: "ACTION STYLE",
    pos: { code: "V", label: "VANGUARD",   jp: "前衛", detail: "速さで前に出る。積極的に仕掛け、相手の反応を引き出す" },
    neg: { code: "S", label: "SCOUT",      jp: "斥候", detail: "状況を読んでから動く。観察と情報優位でじっくり立ち回る" },
  },
  OD: {
    axis: "PERCEPTION",
    pos: { code: "O", label: "OBSERVER",   jp: "観察派", detail: "細部を正確に記憶する。具体的な数字・順序・位置を把握する" },
    neg: { code: "D", label: "DREAMER",    jp: "構想派", detail: "全体のパターンを直感で捉える。細部より流れと感覚で動く" },
  },
  LH: {
    axis: "VALUE SYSTEM",
    pos: { code: "L", label: "LOGIC",      jp: "論理派", detail: "効率・結果・最適解を優先。感情より客観的な判断基準で動く" },
    neg: { code: "H", label: "HEART",      jp: "共感派", detail: "チームの気持ちと調和を優先。人との繋がりと関係性で動く" },
  },
  PI: {
    axis: "PLAY APPROACH",
    pos: { code: "P", label: "PLANNER",    jp: "計画派", detail: "行動前に計画を立てる。最適な手順を考えてから動く" },
    neg: { code: "I", label: "IMPROVISER", jp: "即興派", detail: "試しながら適応する。状況に合わせてその場で判断・修正する" },
  },
};

function AllAxesGuide({ code }: { code: TypeCode }) {
  // Which side is the user on per axis
  const userSide = {
    VS: code[0] as "V" | "S",
    OD: code[1] as "O" | "D",
    LH: code[2] as "L" | "H",
    PI: code[3] as "P" | "I",
  };

  return (
    <section className="w-full space-y-3">
      <h2 className="text-xs tracking-[0.3em] text-[var(--color-muted)]">ALL AXES</h2>
      {AXIS_ORDER.map((axis) => {
        const data = AXIS_BOTH[axis];
        const userCode = userSide[axis];
        return (
          <div key={axis} className="card p-4 space-y-3">
            <p className="text-xs text-[var(--color-muted)] tracking-widest">{data.axis}</p>
            <div className="grid grid-cols-2 gap-3">
              {([data.pos, data.neg] as const).map((side) => {
                const isUser = side.code === userCode;
                return (
                  <div
                    key={side.code}
                    className={`rounded-lg p-3 border transition-all ${
                      isUser
                        ? "border-[var(--color-primary)] bg-cyan-950/30"
                        : "border-[var(--color-border)] opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-base font-black ${isUser ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"}`}
                        style={{ fontFamily: "var(--font-press-start, monospace)" }}
                      >
                        {side.code}
                      </span>
                      <span className="text-xs font-bold tracking-wider">{side.jp}</span>
                      {isUser && <span className="ml-auto text-xs text-[var(--color-primary)]">← YOU</span>}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">{side.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}

// ── 全 16 タイプ一覧 ──────────────────────────────────────────────────────────

const ALL_CODES_ORDERED: TypeCode[] = [
  "VDLP","VDLI","VDLP","VDHI","VDHP","VOLI","VOLP","VOHI","VOHP",
  "SDLP","SDLI","SDHI","SDHP","SOLI","SOLP","SOHI","SOHP",
].filter((v, i, a) => a.indexOf(v) === i) as TypeCode[];

// Ordered 4×4 by V/S then sub-groups
const TYPE_GRID: TypeCode[][] = [
  ["VDLP","VDLI","VDHP","VDHI"],
  ["VOLP","VOLI","VOHP","VOHI"],
  ["SDLP","SDLI","SDHP","SDHI"],
  ["SOLP","SOLI","SOHP","SOHI"],
];

function AllTypesGrid({ userCode, locale }: { userCode: TypeCode; locale: string }) {
  const [expanded, setExpanded] = useState<TypeCode | null>(null);

  return (
    <section className="w-full space-y-3">
      <h2 className="text-xs tracking-[0.3em] text-[var(--color-muted)]">ALL 16 TYPES</h2>
      <p className="text-xs text-[var(--color-muted)]">タップで詳細を見る</p>
      <div className="space-y-2">
        {TYPE_GRID.map((row, ri) => (
          <div key={ri} className="grid grid-cols-4 gap-2">
            {row.map((tc) => {
              const isUser = tc === userCode;
              const isExp  = expanded === tc;
              const name   = locale === "ja" ? TYPE_NAMES[tc].ja : TYPE_NAMES[tc].en;
              return (
                <button
                  key={tc}
                  onClick={() => setExpanded(isExp ? null : tc)}
                  aria-pressed={isExp}
                  className={`
                    rounded-lg border p-2 text-left transition-all active:scale-95
                    ${isUser
                      ? "border-[var(--color-primary)] bg-cyan-950/40 shadow-[0_0_8px_var(--color-primary)]"
                      : isExp
                        ? "border-[var(--color-secondary)]"
                        : "border-[var(--color-border)] hover:border-zinc-500"}
                  `}
                >
                  <p
                    className={`text-xs font-black tracking-wider mb-0.5 ${isUser ? "text-[var(--color-primary)]" : "text-zinc-300"}`}
                    style={{ fontFamily: "var(--font-press-start, monospace)", fontSize: "0.55rem" }}
                  >
                    {tc}
                  </p>
                  <p className="text-xs text-zinc-400 leading-tight truncate">{name}</p>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Expanded detail */}
      {expanded && (() => {
        const name = locale === "ja" ? TYPE_NAMES[expanded].ja : TYPE_NAMES[expanded].en;
        const catchphrase = TYPE_NAMES_DETAIL[expanded]?.[locale === "ja" ? "ja" : "en"] ?? "";
        return (
          <div className="card p-4 space-y-1 border-[var(--color-secondary)]">
            <div className="flex items-center justify-between">
              <div>
                <span
                  className="text-xs font-black text-[var(--color-secondary)] mr-2"
                  style={{ fontFamily: "var(--font-press-start, monospace)" }}
                >
                  {expanded}
                </span>
                <span className="font-bold">{name}</span>
                {expanded === userCode && (
                  <span className="ml-2 text-xs text-[var(--color-primary)]">← あなた</span>
                )}
              </div>
              <button
                className="text-[var(--color-muted)] text-sm"
                onClick={() => setExpanded(null)}
                aria-label="Close"
              >✕</button>
            </div>
            {catchphrase && <p className="text-xs text-[var(--color-secondary)] italic">{catchphrase}</p>}
          </div>
        );
      })()}
    </section>
  );
}

// キャッチフレーズ（messages から取れないのでここに持つ）
const TYPE_NAMES_DETAIL: Partial<Record<TypeCode, { ja: string; en: string }>> = {
  SDLP: { ja: "盤面の 10 手先を読む",           en: "Reading 10 moves ahead" },
  SDLI: { ja: "仮説と検証を繰り返す",            en: "Hypothesis, test, repeat" },
  VDLP: { ja: "戦場で迷わず指揮を執る",          en: "No hesitation on the battlefield" },
  VDLI: { ja: "議論を制し、新しいルールを作る",  en: "Win the argument, rewrite the rules" },
  SDHP: { ja: "世界の物語を誰よりも深く知る",    en: "Knows the story better than anyone" },
  SDHI: { ja: "自分の物語を自分で紡ぐ",          en: "Writing your own story" },
  VDHP: { ja: "全員が輝けるステージを作る",      en: "Building a stage where everyone shines" },
  VDHI: { ja: "どこへでも。誰とでも。今すぐ",    en: "Anywhere. With anyone. Right now." },
  SOLP: { ja: "最速・最短で目標を達成する",      en: "Fastest route, every time" },
  SOHP: { ja: "誰かが倒れそうな時、そこにいる",  en: "There when someone is about to fall" },
  VOLP: { ja: "チームを動かし、目標に走る",      en: "Move the team, run toward the goal" },
  VOHP: { ja: "みんなが笑顔のパーティを作る",    en: "Creating a party where everyone smiles" },
  SOLI: { ja: "一発必中。無駄は省く",            en: "One shot, one hit. No waste." },
  SOHI: { ja: "自分のペースで一品物を",          en: "One-of-a-kind work, at my own pace" },
  VOLI: { ja: "先頭を走る。考えるのは後で",      en: "Lead the charge. Think later." },
  VOHI: { ja: "舞台は世界。君が主役だ",          en: "The world is your stage. You're the star." },
};

function StyleAxes({ code, axisScores, locale }: {
  code: TypeCode;
  axisScores: Record<AxisKey, number>;
  locale: string;
}) {
  return (
    <section className="w-full space-y-3">
      <h2 className="text-xs tracking-[0.3em] text-[var(--color-muted)]">STYLE AXES</h2>
      {AXIS_ORDER.map((axis) => {
        const score = axisScores[axis];       // -50 to +50
        const isPos = score >= 0;
        const side  = isPos ? AXIS_STYLE[axis].pos : AXIS_STYLE[axis].neg;
        const pct   = Math.round(Math.abs(score) / 50 * 100); // 0-100% confidence
        const barColor = isPos ? "bg-[var(--color-primary)]" : "bg-[var(--color-secondary)]";

        return (
          <div key={axis} className="card px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className={`text-xs font-black tracking-widest ${isPos ? "text-[var(--color-primary)]" : "text-[var(--color-secondary)]"}`}>
                  {side.code}
                </span>
                <span className="ml-2 text-xs text-[var(--color-muted)] tracking-wider">{side.label}</span>
              </div>
              <span className="text-xs text-[var(--color-muted)] tabular-nums">{pct}%</span>
            </div>
            <div className="h-1 w-full bg-[var(--color-border)] rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full ${barColor} transition-all duration-700`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-zinc-400">{side.desc}</p>
          </div>
        );
      })}
    </section>
  );
}

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
        <p className="text-xs tracking-[0.3em] text-[var(--color-muted)]">YOUR GAME STYLE</p>
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

      {/* ── Style axes ── */}
      <StyleAxes code={code} axisScores={axisScores} locale={locale} />

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

      {/* ── Gaming Profile ── */}
      <section className="w-full space-y-4">
        <h2 className="text-xs tracking-[0.3em] text-[var(--color-muted)]">GAMING PROFILE</h2>

        {/* Roles */}
        {t.has(`types.${code}.bestRoles.0`) && (
          <div className="card p-4">
            <p className="text-xs text-[var(--color-secondary)] mb-3 tracking-widest">ゲームロール</p>
            <div className="flex flex-wrap gap-2">
              {[0, 1].map((i) =>
                t.has(`types.${code}.bestRoles.${i}`) ? (
                  <span key={i} className="px-3 py-1 rounded-full text-sm border border-[var(--color-secondary)] text-[var(--color-secondary)]">
                    {t(`types.${code}.bestRoles.${i}`)}
                  </span>
                ) : null
              )}
            </div>
          </div>
        )}

        {/* Active scenes */}
        {t.has(`types.${code}.shines.0`) && (
          <div className="card p-4">
            <p className="text-xs text-[var(--color-success)] mb-3 tracking-widest">活きる場面</p>
            <ul className="space-y-1">
              {[0, 1, 2].map((i) =>
                t.has(`types.${code}.shines.${i}`) ? (
                  <li key={i} className="text-sm text-zinc-300">▸ {t(`types.${code}.shines.${i}`)}</li>
                ) : null
              )}
            </ul>
          </div>
        )}

        {/* Game genres */}
        <div className="card p-4">
          <p className="text-xs text-[var(--color-primary)] mb-3 tracking-widest">向いているゲームジャンル</p>
          <div className="flex flex-wrap gap-2">
            {getGameGenres(code).map((genre) => (
              <span key={genre} className="px-3 py-1 rounded-full text-xs border border-[var(--color-border)] text-zinc-300">
                {genre}
              </span>
            ))}
          </div>
        </div>
      </section>

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

      {/* ── All axes guide ── */}
      <AllAxesGuide code={code} />

      {/* ── All 16 types ── */}
      <AllTypesGrid userCode={code} locale={locale} />

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
