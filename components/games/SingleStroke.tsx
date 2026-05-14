"use client";

import { useState, useCallback, useRef } from "react";
import { PUZZLES, edgeId, getAdjacent } from "@/lib/single-stroke-puzzles";
import { scoreSingleStroke } from "@/lib/scoring";
import type { GameResult } from "@/lib/types";
import { SE } from "@/lib/sound";
import { GameShell } from "./GameShell";

interface Props {
  onComplete: (result: GameResult) => void;
}

interface PuzzleResult {
  completed: boolean;
  thinkMs: number;
  solveMs: number;
  restarts: number;
}

const PUZZLES_TO_PLAY = [PUZZLES[0], PUZZLES[1], PUZZLES[2]]; // easy, medium, hard
const VIEWBOX = "0 0 400 460";

export function SingleStroke({ onComplete }: Props) {
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [started, setStarted] = useState(false);
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [usedEdges, setUsedEdges] = useState<Set<string>>(new Set());
  const [path, setPath] = useState<string[]>([]);
  const [restarts, setRestarts] = useState(0);
  const [showDeadEnd, setShowDeadEnd] = useState(false);
  const [puzzleResults, setPuzzleResults] = useState<PuzzleResult[]>([]);
  const puzzleStartRef = useRef<number>(0);
  const firstMoveRef = useRef<number | null>(null);

  const puzzle = PUZZLES_TO_PLAY[puzzleIdx];

  const resetPuzzle = useCallback((extraRestarts = 0) => {
    setCurrentNode(null);
    setUsedEdges(new Set());
    setPath([]);
    setShowDeadEnd(false);
    setRestarts((r) => r + extraRestarts);
    firstMoveRef.current = null;
    puzzleStartRef.current = performance.now();
  }, []);

  const startGame = () => {
    setStarted(true);
    resetPuzzle();
    puzzleStartRef.current = performance.now();
  };

  const finalize = useCallback((results: PuzzleResult[]) => {
    const completed = results.filter((r) => r.completed).length;
    const totalMs = results.reduce((s, r) => s + r.solveMs, 0);
    const avgThinkMs = results.reduce((s, r) => s + r.thinkMs, 0) / results.length;
    const totalRestarts = results.reduce((s, r) => s + r.restarts, 0);
    const { score, axisDeltas } = scoreSingleStroke({ completed, totalMs, avgThinkMs, restarts: totalRestarts });
    setTimeout(() => onComplete({
      gameId: "single-stroke",
      score,
      durationMs: totalMs,
      rawData: { completed, totalMs, avgThinkMs: Math.round(avgThinkMs), restarts: totalRestarts },
      axisDeltas,
    }), 500);
  }, [onComplete]);

  const completeCurrentPuzzle = useCallback((solved: boolean) => {
    SE.success();
    const thinkMs = firstMoveRef.current
      ? firstMoveRef.current - puzzleStartRef.current
      : 0;
    const solveMs = performance.now() - puzzleStartRef.current;
    const result: PuzzleResult = {
      completed: solved,
      thinkMs,
      solveMs,
      restarts,
    };
    const allResults = [...puzzleResults, result];
    setPuzzleResults(allResults);
    if (puzzleIdx + 1 >= PUZZLES_TO_PLAY.length) {
      finalize(allResults);
    } else {
      setPuzzleIdx((i) => i + 1);
      setRestarts(0);
      resetPuzzle();
    }
  }, [finalize, puzzleIdx, puzzleResults, restarts, resetPuzzle]);

  const tapNode = useCallback((nodeId: string) => {
    if (showDeadEnd) return;

    if (!currentNode) {
      // First node selection
      if (!firstMoveRef.current) firstMoveRef.current = performance.now();
      SE.tap();
      setCurrentNode(nodeId);
      setPath([nodeId]);
      return;
    }

    if (nodeId === currentNode) return;

    const eid = edgeId(currentNode, nodeId);
    const adj = getAdjacent(puzzle, currentNode);

    if (!adj.includes(nodeId) || usedEdges.has(eid)) return;

    SE.tap();
    const newUsed = new Set(usedEdges);
    newUsed.add(eid);
    const newPath = [...path, nodeId];

    setUsedEdges(newUsed);
    setPath(newPath);
    setCurrentNode(nodeId);

    // Check win: all edges used
    if (newUsed.size === puzzle.edges.length) {
      completeCurrentPuzzle(true);
      return;
    }

    // Check dead end: no adjacent unused edges from new node
    const nextAdj = getAdjacent(puzzle, nodeId);
    const hasMove = nextAdj.some((n) => !newUsed.has(edgeId(nodeId, n)));
    if (!hasMove) {
      SE.fail();
      setShowDeadEnd(true);
    }
  }, [currentNode, usedEdges, path, puzzle, showDeadEnd, completeCurrentPuzzle]);

  const handleRestart = useCallback(() => {
    setRestarts((r) => r + 1);
    resetPuzzle();
  }, [resetPuzzle]);

  const isEdgeUsed = (from: string, to: string) => usedEdges.has(edgeId(from, to));
  const isNodeActive = (id: string) => id === currentNode;
  const isNodeInPath = (id: string) => path.includes(id);

  return (
    <GameShell onRestart={handleRestart}>
      {(paused) => (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4">
          {!started ? (
            <div className="text-center space-y-4">
              <p className="text-xl font-bold">ペンを離さず全辺を通れ</p>
              <p className="text-sm text-[var(--color-muted)]">ノードをタップして始め、隣のノードへ順に辿れ。3 問。</p>
              <button
                className="px-8 py-4 rounded-full bg-[var(--color-primary)] text-black font-black"
                onClick={startGame}
              >START</button>
            </div>
          ) : (
            <>
              <div className="text-center">
                <p className="text-xs text-[var(--color-muted)] tracking-widest">
                  PUZZLE {puzzleIdx + 1} / {PUZZLES_TO_PLAY.length} — {puzzle.difficulty.toUpperCase()}
                </p>
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  残り辺: {puzzle.edges.length - usedEdges.size} / {puzzle.edges.length}
                </p>
              </div>

              {/* SVG puzzle */}
              <div className="w-full max-w-sm aspect-[400/460] card p-2">
                <svg viewBox={VIEWBOX} className="w-full h-full">
                  {/* Edges */}
                  {puzzle.edges.map((e) => {
                    const fn = puzzle.nodes.find((n) => n.id === e.from)!;
                    const tn = puzzle.nodes.find((n) => n.id === e.to)!;
                    const used = isEdgeUsed(e.from, e.to);
                    return (
                      <line
                        key={edgeId(e.from, e.to)}
                        x1={fn.x} y1={fn.y} x2={tn.x} y2={tn.y}
                        stroke={used ? "var(--color-primary)" : "var(--color-border)"}
                        strokeWidth={used ? 4 : 3}
                        strokeLinecap="round"
                      />
                    );
                  })}

                  {/* Nodes */}
                  {puzzle.nodes.map((n) => {
                    const active = isNodeActive(n.id);
                    const inPath = isNodeInPath(n.id);
                    return (
                      <g key={n.id} onClick={() => tapNode(n.id)} style={{ cursor: "pointer" }}>
                        <circle
                          cx={n.x} cy={n.y} r={22}
                          fill={active ? "var(--color-primary)" : inPath ? "var(--color-surface)" : "var(--color-surface)"}
                          stroke={active ? "var(--color-primary)" : inPath ? "var(--color-primary)" : "var(--color-border)"}
                          strokeWidth={active ? 3 : 2}
                        />
                        <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize={13}
                          fill={active ? "black" : "var(--color-muted)"}
                          style={{ pointerEvents: "none", userSelect: "none" }}
                        >
                          {n.id}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {showDeadEnd && (
                <div className="text-center space-y-4">
                  <p className="text-[var(--color-warning)] font-bold">行き止まり！</p>
                  <button
                    className="px-6 py-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-warning)] text-[var(--color-warning)] font-bold"
                    onClick={handleRestart}
                  >
                    やり直す
                  </button>
                </div>
              )}

              {!showDeadEnd && !currentNode && (
                <p className="text-sm text-[var(--color-muted)]">開始ノードをタップ</p>
              )}
            </>
          )}
        </div>
      )}
    </GameShell>
  );
}
