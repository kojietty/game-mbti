"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { GAME_META, GAME_ORDER } from "@/lib/game-config";
import type { GameResult } from "@/lib/types";

interface Props {
  result: GameResult;
  completedCount: number; // how many games done so far (1-8)
  onNext: () => void;
}

export function StageBridge({ result, completedCount, onNext }: Props) {
  const t = useTranslations("common");
  const meta = GAME_META[result.gameId];
  const metric = meta.formatMetric(result);
  const isLast = completedCount >= GAME_ORDER.length;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-8">
      {/* Header */}
      <div>
        <p className="text-xs tracking-[0.3em] text-[var(--color-primary)] mb-2">
          STAGE {meta.stageNum} / 8
        </p>
        <h2
          className="text-2xl sm:text-4xl font-black tracking-widest"
          style={{ fontFamily: "var(--font-orbitron, sans-serif)" }}
        >
          {t("complete")}
        </h2>
      </div>

      {/* Score card */}
      <div className="card px-8 py-6 flex flex-col items-center gap-3 w-full max-w-xs">
        <p className="text-sm text-[var(--color-muted)]">{metric}</p>
        <p className="text-5xl font-black tabular-nums text-[var(--color-primary)]">
          {result.score}
        </p>
        <p className="text-xs text-[var(--color-muted)] uppercase tracking-widest">
          {t("score")}
        </p>
      </div>

      {/* Progress */}
      <ProgressBar
        current={completedCount}
        total={GAME_ORDER.length}
        className="w-full max-w-xs"
      />

      <Button size="lg" onClick={onNext} className="min-w-48">
        {isLast ? "See Results" : t("nextStage")}
      </Button>
    </div>
  );
}
