"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useStore, GAME_COUNT } from "@/lib/store";
import { GAME_ORDER } from "@/lib/game-config";
import { aggregateAxisScores, aggregateSkills } from "@/lib/scoring";
import { buildFinalResult } from "@/lib/type-code";
import { submitResult } from "@/lib/submit";
import type { GameResult } from "@/lib/types";

import { StageIntro } from "@/components/flow/StageIntro";
import { StageBridge } from "@/components/flow/StageBridge";
import { CompilingResults } from "@/components/flow/CompilingResults";
import { QuickReact } from "@/components/games/QuickReact";

type Phase =
  | { kind: "stage-intro" }
  | { kind: "game" }
  | { kind: "bridge"; result: GameResult }
  | { kind: "compiling" };

// Map gameId → game component
function GameComponent({
  gameId,
  onComplete,
}: {
  gameId: (typeof GAME_ORDER)[number];
  onComplete: (r: GameResult) => void;
}) {
  switch (gameId) {
    case "quick-react":
      return <QuickReact onComplete={onComplete} />;
    // Remaining games: stub for now
    default:
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-6 text-center">
          <p className="text-[var(--color-muted)] text-sm">
            Game coming soon: {gameId}
          </p>
          <button
            className="px-6 py-3 rounded-lg bg-[var(--color-primary)] text-black font-bold"
            onClick={() =>
              onComplete({
                gameId,
                score: 50,
                durationMs: 0,
                rawData: {},
                axisDeltas: {},
              })
            }
          >
            Skip (dev)
          </button>
        </div>
      );
  }
}

export default function PlayPage() {
  const router = useRouter();
  const locale = useLocale();
  const { gameIndex, results, startSession, submitGame, setFinalResult, consented } = useStore();
  const [phase, setPhase] = useState<Phase>({ kind: "stage-intro" });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Start session if fresh
  useEffect(() => {
    if (!hydrated) return;
    if (gameIndex === 0 && results.length === 0) {
      startSession();
    }
  }, [hydrated, gameIndex, results.length, startSession]);

  const currentGameId = GAME_ORDER[gameIndex] ?? GAME_ORDER[GAME_COUNT - 1];

  const handleGameComplete = useCallback(
    (result: GameResult) => {
      submitGame(result);
      setPhase({ kind: "bridge", result });
    },
    [submitGame]
  );

  const handleNext = useCallback(() => {
    // gameIndex is already incremented by submitGame
    const nextIndex = useStore.getState().gameIndex;
    if (nextIndex >= GAME_COUNT) {
      setPhase({ kind: "compiling" });
    } else {
      setPhase({ kind: "stage-intro" });
    }
  }, []);

  const handleCompiled = useCallback(async () => {
    const { results: allResults } = useStore.getState();
    const axisScores = aggregateAxisScores(allResults);
    const skills = aggregateSkills(allResults);
    const finalResult = buildFinalResult(axisScores, skills, allResults);
    setFinalResult(finalResult);
    await submitResult(finalResult, locale, consented);
    router.push(`/${locale}/result`);
  }, [locale, consented, setFinalResult, router]);

  if (!hydrated) return null;

  return (
    <>
      {phase.kind === "stage-intro" && (
        <StageIntro
          gameId={currentGameId}
          onBegin={() => setPhase({ kind: "game" })}
        />
      )}

      {phase.kind === "game" && (
        <GameComponent
          gameId={currentGameId}
          onComplete={handleGameComplete}
        />
      )}

      {phase.kind === "bridge" && (
        <StageBridge
          result={phase.result}
          completedCount={useStore.getState().results.length}
          onNext={handleNext}
        />
      )}

      {phase.kind === "compiling" && (
        <CompilingResults onDone={handleCompiled} />
      )}
    </>
  );
}
