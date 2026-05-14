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

import { QuickReact }       from "@/components/games/QuickReact";
import { TargetHunter }     from "@/components/games/TargetHunter";
import { SequenceMemory }   from "@/components/games/SequenceMemory";
import { PatternPredictor } from "@/components/games/PatternPredictor";
import { SingleStroke }     from "@/components/games/SingleStroke";
import { CodeBreaker }      from "@/components/games/CodeBreaker";
import { RpgCrossroads }    from "@/components/games/RpgCrossroads";
import { PartyPick }        from "@/components/games/PartyPick";

type Phase =
  | { kind: "stage-intro" }
  | { kind: "game" }
  | { kind: "bridge"; result: GameResult }
  | { kind: "compiling" };

function GameComponent({
  gameId,
  onComplete,
}: {
  gameId: (typeof GAME_ORDER)[number];
  onComplete: (r: GameResult) => void;
}) {
  switch (gameId) {
    case "quick-react":       return <QuickReact onComplete={onComplete} />;
    case "target-hunter":     return <TargetHunter onComplete={onComplete} />;
    case "sequence-memory":   return <SequenceMemory onComplete={onComplete} />;
    case "pattern-predictor": return <PatternPredictor onComplete={onComplete} />;
    case "single-stroke":     return <SingleStroke onComplete={onComplete} />;
    case "code-breaker":      return <CodeBreaker onComplete={onComplete} />;
    case "rpg-crossroads":    return <RpgCrossroads onComplete={onComplete} />;
    case "party-pick":        return <PartyPick onComplete={onComplete} />;
    default:                  return null;
  }
}

export default function PlayPage() {
  const router = useRouter();
  const locale = useLocale();
  const { gameIndex, results, startSession, submitGame, setFinalResult, consented } = useStore();
  const [phase, setPhase] = useState<Phase>({ kind: "stage-intro" });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!hydrated) return;
    if (gameIndex === 0 && results.length === 0) startSession();
  }, [hydrated, gameIndex, results.length, startSession]);

  const currentGameId = GAME_ORDER[Math.min(gameIndex, GAME_COUNT - 1)];

  const handleGameComplete = useCallback((result: GameResult) => {
    submitGame(result);
    setPhase({ kind: "bridge", result });
  }, [submitGame]);

  const handleNext = useCallback(() => {
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
        <GameComponent gameId={currentGameId} onComplete={handleGameComplete} />
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
