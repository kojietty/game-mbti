import type { GameId } from "./types";
import type { GameResult } from "./types";

export const GAME_ORDER: GameId[] = [
  "quick-react",       // 1 VS
  "quick-stop",        // 2 VS ← NEW
  "sequence-memory",   // 3 OD
  "mission-brief",     // 4 OD ← NEW
  "target-hunter",     // 5 VS+PI
  "pattern-predictor", // 6 OD (Flash Sense)
  "single-stroke",     // 7 PI
  "quest-select",      // 8 PI ← NEW
  "code-breaker",      // 9 PI
  "rpg-crossroads",    // 10 LH
  "loot-allocation",   // 11 LH ← NEW
  "party-pick",        // 12 LH
];

export interface GameMeta {
  stageNum: number;
  iconName: string;
  axis: string;
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
  "quick-stop": {
    stageNum: 2,
    iconName: "Timer",
    axis: "VS",
    formatMetric: (r) => {
      const acc = r.rawData.avgAccuracy as number | undefined;
      return acc != null ? `Avg accuracy: ${Math.round(acc * 100)}%` : `Score: ${r.score}`;
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
  "mission-brief": {
    stageNum: 4,
    iconName: "FileText",
    axis: "OD",
    formatMetric: (r) => {
      const correct = r.rawData.correct as number | undefined;
      const total = r.rawData.total as number | undefined;
      return correct != null && total != null ? `${correct} / ${total} correct` : `Score: ${r.score}`;
    },
  },
  "target-hunter": {
    stageNum: 5,
    iconName: "Crosshair",
    axis: "VS",
    formatMetric: (r) => {
      const hits = r.rawData.hits as number | undefined;
      return hits != null ? `Hits: ${hits}` : `Score: ${r.score}`;
    },
  },
  "pattern-predictor": {
    stageNum: 6,
    iconName: "Eye",
    axis: "OD",
    formatMetric: (r) => {
      const acc = r.rawData.avgAccuracy as number | undefined;
      return acc != null ? `Avg accuracy: ${acc}%` : `Score: ${r.score}`;
    },
  },
  "single-stroke": {
    stageNum: 7,
    iconName: "Waypoints",
    axis: "PI",
    formatMetric: (r) => {
      const completed = r.rawData.completed as number | undefined;
      return completed != null ? `${completed} / 3 solved` : `Score: ${r.score}`;
    },
  },
  "quest-select": {
    stageNum: 8,
    iconName: "ListChecks",
    axis: "PI",
    formatMetric: (r) => {
      const eff = r.rawData.efficiency as number | undefined;
      return eff != null ? `Efficiency: ${Math.round(eff * 100)}%` : `Score: ${r.score}`;
    },
  },
  "code-breaker": {
    stageNum: 9,
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
    stageNum: 10,
    iconName: "GitFork",
    axis: "LH",
    formatMetric: (r) => `Score: ${r.score}`,
  },
  "loot-allocation": {
    stageNum: 11,
    iconName: "Coins",
    axis: "LH",
    formatMetric: (r) => `Score: ${r.score}`,
  },
  "party-pick": {
    stageNum: 12,
    iconName: "Users",
    axis: "LH",
    formatMetric: (r) => `Score: ${r.score}`,
  },
};
