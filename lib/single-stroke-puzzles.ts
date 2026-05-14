export interface StrokeNode {
  id: string;
  x: number;
  y: number;
}

export interface StrokeEdge {
  from: string;
  to: string;
}

export interface StrokePuzzle {
  id: string;
  difficulty: "easy" | "medium" | "hard";
  nodes: StrokeNode[];
  edges: StrokeEdge[];
  // Nodes with odd degree (valid starting points for Euler path)
  oddNodes: string[];
}

export const PUZZLES: StrokePuzzle[] = [
  // ── Easy: Square + Diagonal ──────────────────────────────────────────────────
  // Degrees: A=2, B=3*, C=2, D=3*  → Euler path B↔D
  {
    id: "square-diagonal",
    difficulty: "easy",
    nodes: [
      { id: "A", x: 80,  y: 80  },
      { id: "B", x: 320, y: 80  },
      { id: "C", x: 320, y: 320 },
      { id: "D", x: 80,  y: 320 },
    ],
    edges: [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
      { from: "C", to: "D" },
      { from: "D", to: "A" },
      { from: "B", to: "D" },
    ],
    oddNodes: ["B", "D"],
  },
  // ── Medium: House ─────────────────────────────────────────────────────────────
  // Degrees: A=4, B=2, C=4, D=3*, E=3*  → Euler path D↔E
  {
    id: "house",
    difficulty: "medium",
    nodes: [
      { id: "A", x: 80,  y: 300 },
      { id: "B", x: 200, y: 120 },
      { id: "C", x: 320, y: 300 },
      { id: "D", x: 200, y: 300 },
      { id: "E", x: 200, y: 210 },
    ],
    edges: [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
      { from: "A", to: "C" },
      { from: "A", to: "D" },
      { from: "D", to: "C" },
      { from: "D", to: "E" },
      { from: "E", to: "A" },
      { from: "E", to: "C" },
    ],
    oddNodes: ["D", "E"],
  },
  // ── Hard: Grid (3×2 partial) ─────────────────────────────────────────────────
  // Degrees: A=2, B=3*, C=2, D=3*, E=4, F=2, G=2, H=2  → Euler path B↔D
  {
    id: "grid",
    difficulty: "hard",
    nodes: [
      { id: "A", x: 80,  y: 90  },
      { id: "B", x: 200, y: 90  },
      { id: "C", x: 320, y: 90  },
      { id: "D", x: 80,  y: 230 },
      { id: "E", x: 200, y: 230 },
      { id: "F", x: 320, y: 230 },
      { id: "G", x: 80,  y: 370 },
      { id: "H", x: 200, y: 370 },
    ],
    edges: [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
      { from: "A", to: "D" },
      { from: "B", to: "E" },
      { from: "C", to: "F" },
      { from: "D", to: "E" },
      { from: "E", to: "F" },
      { from: "D", to: "G" },
      { from: "E", to: "H" },
      { from: "G", to: "H" },
    ],
    oddNodes: ["B", "D"],
  },
];

export function edgeId(a: string, b: string): string {
  return [a, b].sort().join("-");
}

export function getAdjacent(puzzle: StrokePuzzle, nodeId: string): string[] {
  return puzzle.edges
    .filter((e) => e.from === nodeId || e.to === nodeId)
    .map((e) => (e.from === nodeId ? e.to : e.from));
}
