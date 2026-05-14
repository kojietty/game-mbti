/**
 * Game type IDs (8 games total).
 */
export type GameId =
  | "quick-react"
  | "target-hunter"
  | "sequence-memory"
  | "pattern-predictor"
  | "single-stroke"
  | "code-breaker"
  | "rpg-crossroads"
  | "party-pick";

/**
 * Axis letters (8 unique letters across 4 axes).
 * Positive side: V / O / L / P
 * Negative side: S / D / H / I
 */
export type AxisLetter = "V" | "S" | "O" | "D" | "L" | "H" | "P" | "I";

/**
 * 4-character type code (16 total combinations).
 */
export type TypeCode = `${"V" | "S"}${"O" | "D"}${"L" | "H"}${"P" | "I"}`;

/**
 * Axis keys for storing deviation scores.
 */
export type AxisKey = "VS" | "OD" | "LH" | "PI";

/**
 * Confidence level for an axis classification.
 */
export type AxisConfidence = "high" | "medium" | "low";

export interface GameResult {
  gameId: GameId;
  score: number;
  durationMs: number;
  rawData: Record<string, unknown>;
  axisDeltas: Partial<Record<AxisKey, number>>;
}

export interface FinalResult {
  code: TypeCode;
  altCode?: TypeCode;
  axisScores: Record<AxisKey, number>;
  axisConfidence: Record<AxisKey, AxisConfidence>;
  borderlineAxes: AxisKey[];
  skills: {
    reaction: number;
    memory: number;
    logic: number;
    empathy: number;
    planning: number;
  };
  perGame: GameResult[];
}
