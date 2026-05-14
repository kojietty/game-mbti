import type {
  TypeCode,
  AxisKey,
  AxisLetter,
  AxisConfidence,
  FinalResult,
  GameResult,
} from "./types";

const BORDERLINE_THRESHOLD = 10;

// Axis position → letter mapping
const AXIS_MAP: Record<AxisKey, [AxisLetter, AxisLetter]> = {
  VS: ["V", "S"],
  OD: ["O", "D"],
  LH: ["L", "H"],
  PI: ["P", "I"],
};

const AXIS_ORDER: AxisKey[] = ["VS", "OD", "LH", "PI"];

// ─── Axis classification ──────────────────────────────────────────────────────

export function classifyAxis(
  delta: number,
  axis: AxisKey
): { letter: AxisLetter; confidence: AxisConfidence; borderline: boolean } {
  const [pos, neg] = AXIS_MAP[axis];
  const abs = Math.abs(delta);
  return {
    letter: delta >= 0 ? pos : neg,
    confidence: abs >= 25 ? "high" : abs >= BORDERLINE_THRESHOLD ? "medium" : "low",
    borderline: abs < BORDERLINE_THRESHOLD,
  };
}

// ─── TypeCode construction ────────────────────────────────────────────────────

export function buildTypeCode(axisScores: Record<AxisKey, number>): TypeCode {
  return AXIS_ORDER.map((axis) => classifyAxis(axisScores[axis], axis).letter).join(
    ""
  ) as TypeCode;
}

// Alt code: flip the most borderline axis
export function buildAltCode(
  axisScores: Record<AxisKey, number>,
  borderlineAxes: AxisKey[]
): TypeCode | undefined {
  if (borderlineAxes.length === 0) return undefined;
  // pick the axis with the smallest |delta|
  const weakest = borderlineAxes.reduce((a, b) =>
    Math.abs(axisScores[a]) <= Math.abs(axisScores[b]) ? a : b
  );
  const main = buildTypeCode(axisScores);
  const chars = main.split("") as AxisLetter[];
  const idx = AXIS_ORDER.indexOf(weakest);
  const [pos, neg] = AXIS_MAP[weakest];
  chars[idx] = chars[idx] === pos ? neg : pos;
  return chars.join("") as TypeCode;
}

// ─── FinalResult construction ─────────────────────────────────────────────────

export function buildFinalResult(
  axisScores: Record<AxisKey, number>,
  skills: FinalResult["skills"],
  perGame: GameResult[]
): FinalResult {
  const axisConfidence = {} as Record<AxisKey, AxisConfidence>;
  const borderlineAxes: AxisKey[] = [];

  for (const axis of AXIS_ORDER) {
    const { confidence, borderline } = classifyAxis(axisScores[axis], axis);
    axisConfidence[axis] = confidence;
    if (borderline) borderlineAxes.push(axis);
  }

  const code = buildTypeCode(axisScores);
  const altCode = buildAltCode(axisScores, borderlineAxes);

  return { code, altCode, axisScores, axisConfidence, borderlineAxes, skills, perGame };
}

// ─── Type metadata ────────────────────────────────────────────────────────────

export const TYPE_NAMES: Record<TypeCode, { en: string; ja: string }> = {
  SDLP: { en: "The Strategist",   ja: "ストラテジスト" },
  SDLI: { en: "The Debugger",     ja: "デバッガー" },
  VDLP: { en: "The Commander",    ja: "コマンダー" },
  VDLI: { en: "The Raid Leader",  ja: "レイドリーダー" },
  SDHP: { en: "The Lorekeeper",   ja: "ロアキーパー" },
  SDHI: { en: "The Roleplayer",   ja: "ロールプレイヤー" },
  VDHP: { en: "The Guildmaster",  ja: "ギルドマスター" },
  VDHI: { en: "The Adventurer",   ja: "アドベンチャラー" },
  SOLP: { en: "The Speedrunner",  ja: "スピードランナー" },
  SOHP: { en: "The Healer",       ja: "ヒーラー" },
  VOLP: { en: "The Captain",      ja: "キャプテン" },
  VOHP: { en: "The Supporter",    ja: "サポーター" },
  SOLI: { en: "The Sniper",       ja: "スナイパー" },
  SOHI: { en: "The Crafter",      ja: "クラフター" },
  VOLI: { en: "The Assaulter",    ja: "アサルター" },
  VOHI: { en: "The Performer",    ja: "パフォーマー" },
};

export const ALL_CODES = Object.keys(TYPE_NAMES) as TypeCode[];
