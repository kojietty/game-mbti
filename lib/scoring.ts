import type { GameResult, AxisKey, GameId } from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function linearScore(value: number, best: number, worst: number): number {
  return clamp(((value - worst) / (best - worst)) * 100, 0, 100);
}

// ─── Game-specific scorers ────────────────────────────────────────────────────

export function scoreQuickReact(raw: {
  avgMs: number;
  flyingCount: number;
}): Pick<GameResult, "score" | "axisDeltas"> {
  // Score: 200ms=100点, 600ms=0点 (表示用はそのまま)
  const base = linearScore(raw.avgMs, 200, 600);
  const flyingPenalty = [0, 10, 25, 50][Math.min(raw.flyingCount, 3)];
  const score = clamp(base - flyingPenalty, 0, 100);

  // 軸判定: ゲーマー集団向けに中立点を 400ms → 300ms に再調整
  // best=180ms, worst=450ms → 300ms 付近が V/S 境界
  const vsBase = linearScore(raw.avgMs, 180, 450);
  const vsDelta = clamp(vsBase - 50 - raw.flyingCount * 8, -50, 50);

  return { score: Math.round(score), axisDeltas: { VS: Math.round(vsDelta) } };
}

export function scoreTargetHunter(raw: {
  hits: number;
  total: number;
  accuracy: number; // 0-1
}): Pick<GameResult, "score" | "axisDeltas"> {
  const hitScore = linearScore(raw.hits, 25, 10);
  const accScore = linearScore(raw.accuracy * 100, 95, 50);
  const score = clamp(hitScore * 0.7 + accScore * 0.3, 0, 100);

  // VS: high combined score → V
  const vsDelta = clamp(score - 50, -50, 50);
  // PI: high accuracy (cautious) → P; high hits over accuracy → I
  const piDelta = clamp((raw.accuracy * 100 - 72) * 1.5, -50, 50);

  return {
    score: Math.round(score),
    axisDeltas: { VS: Math.round(vsDelta * 0.5), PI: Math.round(piDelta * 0.5) },
  };
}

export function scoreSequenceMemory(raw: {
  reached: number;
}): Pick<GameResult, "score" | "axisDeltas"> {
  const score = linearScore(raw.reached, 10, 3);
  // 中立点を 5→6 段に引き上げ、勾配を 10→12 に増加
  // 6 段=中立、8 段=+24(O)、10 段=+48(強 O)、3 段=-36(強 D)
  // Flash Sense と引き合っても両軸がくっきり分かれるよう振れ幅を確保
  const odDelta = clamp((raw.reached - 6) * 12, -50, 50);
  return { score: Math.round(score), axisDeltas: { OD: Math.round(odDelta) } };
}

export function scorePatternPredictor(raw: {
  correct: number; // 0-10
  avgMs: number;
}): Pick<GameResult, "score" | "axisDeltas"> {
  const base = linearScore(raw.correct, 9, 4);
  const timeBonus = raw.avgMs <= 3000 ? 10 : 0;
  const score = clamp(base + timeBonus, 0, 100);

  // OD: fast + high correct → D (intuitive); slow + high correct → neutral
  const odDelta = clamp(((10 - raw.avgMs / 1000) * raw.correct) / 2 - 10, -50, 50);

  return { score: Math.round(score), axisDeltas: { OD: Math.round(-odDelta) } }; // negative → D
}

export function scoreSingleStroke(raw: {
  completed: number; // 0-3
  totalMs: number;
  avgThinkMs: number; // コンポーネント側でパズルごと 15s 上限キャップ済み
  restarts: number;
}): Pick<GameResult, "score" | "axisDeltas"> {
  const base = 100 - (3 - raw.completed) * 25;
  const timePenalty = clamp((raw.totalMs - 60000) / 7000, 0, 30);
  const score = clamp(base - timePenalty, 0, 100);

  // PI 判定の再設計
  // 主信号: リスタート回数（行動の計画性を直接測定、ノイズに強い）
  //   0 回 = +30(P), 3 回 = 0(中立), 6 回以上 = -30(I)
  const restartBase = clamp(30 - raw.restarts * 10, -30, 30);

  // 副信号: 思考時間（外乱上限キャップ後。4s を中立基準に）
  //   8s 以上 = +8(P 加算), 2s 以下 = -8(I 加算)
  const thinkMod = clamp((raw.avgThinkMs - 4000) / 500, -8, 8);

  const piDelta = clamp(restartBase + thinkMod, -50, 50);

  return { score: Math.round(score), axisDeltas: { PI: Math.round(piDelta) } };
}

export function scoreCodeBreaker(raw: {
  attempts: number; // 1-8, or 0 for failed
  solved: boolean;
  avgCandidateReduction: number; // 0-1, how efficiently they narrowed down
}): Pick<GameResult, "score" | "axisDeltas"> {
  const base = raw.solved ? linearScore(raw.attempts, 4, 8) : -10;
  const score = clamp(base, 0, 100);

  // PI: efficient reduction (logical deduction) → P; random guesses → I
  const piDelta = clamp((raw.avgCandidateReduction - 0.5) * 100, -50, 50);

  return { score: Math.round(score), axisDeltas: { PI: Math.round(piDelta) } };
}

export function scoreRpgCrossroads(raw: {
  logicCount: number; // 0-5
  heartCount: number; // 0-5
  neutralCount: number; // 0-5
}): Pick<GameResult, "score" | "axisDeltas"> {
  const consistency = Math.abs(raw.logicCount - raw.heartCount);
  const score = linearScore(consistency, 5, 0);
  const lhDelta = clamp((raw.logicCount - raw.heartCount) * 10, -50, 50);

  return { score: Math.round(score), axisDeltas: { LH: Math.round(lhDelta) } };
}

export function scorePartyPick(raw: {
  pickedIds: string[]; // 3 of ["A","B","C","D","E","F"]
}): Pick<GameResult, "score" | "axisDeltas"> {
  const STATS: Record<string, { combat: number; teamwork: number }> = {
    A: { combat: 95, teamwork: 20 },
    B: { combat: 92, teamwork: 25 },
    C: { combat: 70, teamwork: 75 },
    D: { combat: 65, teamwork: 85 },
    E: { combat: 40, teamwork: 90 },
    F: { combat: 45, teamwork: 80 },
  };

  const picked = raw.pickedIds.slice(0, 3);
  const lSum = picked.reduce((s, id) => s + (STATS[id]?.combat ?? 0), 0);
  const hSum = picked.reduce((s, id) => s + (STATS[id]?.teamwork ?? 0), 0);
  const diff = lSum - hSum;

  // Normalize: max L [A,B,C]=257-120=+137, max H [D,E,F]=150-255=-105
  const lhDelta = clamp((diff / 137) * 50, -50, 50);
  const score = Math.round(Math.abs(lhDelta)); // decisiveness

  return { score, axisDeltas: { LH: Math.round(lhDelta) } };
}

// ─── Axis aggregation ─────────────────────────────────────────────────────────

// Weight of each game's contribution per axis
const AXIS_WEIGHTS: Partial<Record<GameId, Partial<Record<AxisKey, number>>>> = {
  "quick-react":       { VS: 1.0 },
  "target-hunter":     { VS: 0.5, PI: 0.5 },
  "sequence-memory":   { OD: 1.0 },
  "pattern-predictor": { OD: 1.0 },
  "single-stroke":     { PI: 1.0 },
  "code-breaker":      { PI: 0.8 },
  "rpg-crossroads":    { LH: 1.0 },
  "party-pick":        { LH: 0.8 },
};

export function aggregateAxisScores(
  results: GameResult[]
): Record<AxisKey, number> {
  const sums: Record<AxisKey, number> = { VS: 0, OD: 0, LH: 0, PI: 0 };
  const weights: Record<AxisKey, number> = { VS: 0, OD: 0, LH: 0, PI: 0 };

  for (const r of results) {
    const w = AXIS_WEIGHTS[r.gameId] ?? {};
    for (const [axis, weight] of Object.entries(w) as [AxisKey, number][]) {
      const delta = r.axisDeltas[axis];
      if (delta !== undefined) {
        sums[axis] += delta * weight;
        weights[axis] += weight;
      }
    }
  }

  return {
    VS: weights.VS > 0 ? clamp(Math.round(sums.VS / weights.VS), -50, 50) : 0,
    OD: weights.OD > 0 ? clamp(Math.round(sums.OD / weights.OD), -50, 50) : 0,
    LH: weights.LH > 0 ? clamp(Math.round(sums.LH / weights.LH), -50, 50) : 0,
    PI: weights.PI > 0 ? clamp(Math.round(sums.PI / weights.PI), -50, 50) : 0,
  };
}

export function aggregateSkills(
  results: GameResult[]
): { reaction: number; memory: number; logic: number; empathy: number; planning: number } {
  const get = (...ids: GameId[]) => {
    const matching = results.filter((r) => ids.includes(r.gameId));
    if (matching.length === 0) return 0;
    return Math.round(matching.reduce((s, r) => s + r.score, 0) / matching.length);
  };

  return {
    reaction: get("quick-react", "target-hunter"),
    memory: get("sequence-memory", "pattern-predictor"),
    logic: get("single-stroke", "code-breaker"),
    empathy: get("rpg-crossroads", "party-pick"),
    planning: get("single-stroke", "code-breaker", "party-pick"),
  };
}
