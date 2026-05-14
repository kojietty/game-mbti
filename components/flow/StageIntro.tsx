"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { GAME_META } from "@/lib/game-config";
import type { GameId } from "@/lib/types";

interface Props {
  gameId: GameId;
  onBegin: () => void;
}

export function StageIntro({ gameId, onBegin }: Props) {
  const t = useTranslations();
  const meta = GAME_META[gameId];
  const stageKey = gameId as string;

  const title: string = t.has(`stages.${stageKey}.title`)
    ? t(`stages.${stageKey}.title`)
    : gameId.toUpperCase().replace(/-/g, " ");

  const rules: string = t.has(`stages.${stageKey}.rules`)
    ? t(`stages.${stageKey}.rules`)
    : "";

  const controls: string = t.has(`stages.${stageKey}.controls`)
    ? t(`stages.${stageKey}.controls`)
    : "";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      {/* Stage label */}
      <p className="text-xs tracking-[0.3em] text-[var(--color-muted)] mb-8">
        STAGE {meta.stageNum} / 8
      </p>

      {/* Axis badge */}
      <span className="inline-block px-3 py-1 rounded-full text-xs font-mono border border-[var(--color-primary)] text-[var(--color-primary)] mb-6">
        {meta.axis} AXIS
      </span>

      {/* Title */}
      <h1
        className="text-3xl sm:text-5xl font-black tracking-widest mb-8"
        style={{ fontFamily: "var(--font-orbitron, sans-serif)" }}
      >
        {title}
      </h1>

      {/* Rules */}
      {rules && (
        <p className="text-base sm:text-lg text-zinc-300 max-w-sm mb-4 leading-relaxed">
          {rules}
        </p>
      )}

      {/* Controls */}
      {controls && (
        <p className="text-sm text-[var(--color-muted)] mb-12">
          操作: {controls}
        </p>
      )}

      <Button size="lg" onClick={onBegin} className="min-w-48">
        {t("common.beginStage")}
      </Button>
    </div>
  );
}
