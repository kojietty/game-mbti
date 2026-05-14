import type { GameId } from "./types";
import type { GameResult } from "./types";

export const GAME_ORDER: GameId[] = [
  "quick-react",
  "target-hunter",
  "sequence-memory",
  "pattern-predictor",
  "single-stroke",
  "code-breaker",
  "rpg-crossroads",
  "party-pick",
];

export interface GameMeta {
  stageNum: number; // 1-8
  iconName: string; // Lucide icon name
  axis: string;     // displayed axis tag
  /** Format the main bridge-screen metric from rawData */
  formatMetric: (result: GameResult) => string;
}

export const GAME_META: Record<GameId, GameMeta> = {
  "quick-react": {
    stageNum: 1,
    iconName: "Zap",
    axis: "VS",
    formatMetric: (r) => {
      const ms = r.rawData.avgMs as number | undefined;
      return ms != null ? `Avg: ${Math.round(ms)} ms` : `Score: ${r.score}`;
    },
  },
  "target-hunter": {
    stageNum: 2,
    iconName: "Crosshair",
    axis: "VS",
    formatMetric: (r) => {
      const hits = r.rawData.hits as number | undefined;
      return hits != null ? `Hits: ${hits}` : `Score: ${r.score}`;
    },
  },
  "sequence-memory": {
    stageNum: 3,
    iconName: "Brain",
    axis: "OD",
    formatMetric: (r) => {
      const reached = r.rawData.reached as number | undefined;
      return reached != null ? `Reached: ${reached} floors` : `Score: ${r.score}`;
    },
  },
  "pattern-predictor": {
    stageNum: 4,
    iconName: "Eye",
    axis: "OD",
    formatMetric: (r) => {
      const acc = r.rawData.avgAccuracy as number | undefined;
      return acc != null ? `Avg accuracy: ${acc}%` : `Score: ${r.score}`;
    },
  },
  "single-stroke": {
    stageNum: 5,
    iconName: "Waypoints",
    axis: "PI",
    formatMetric: (r) => {
      const completed = r.rawData.completed as number | undefined;
      return completed != null ? `${completed} / 3 solved` : `Score: ${r.score}`;
    },
  },
  "code-breaker": {
    stageNum: 6,
    iconName: "Lock",
    axis: "PI",
    formatMetric: (r) => {
      const attempts = r.rawData.attempts as number | undefined;
      const solved = r.rawData.solved as boolean | undefined;
      if (solved && attempts != null) return `Solved in ${attempts} tries`;
      return `Score: ${r.score}`;
    },
  },
  "rpg-crossroads": {
    stageNum: 7,
    iconName: "GitFork",
    axis: "LH",
    formatMetric: (r) => `Score: ${r.score}`,
  },
  "party-pick": {
    stageNum: 8,
    iconName: "Users",
    axis: "LH",
    formatMetric: (r) => `Score: ${r.score}`,
  },
};
