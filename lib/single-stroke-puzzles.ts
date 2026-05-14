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
  // ── Medium: H 字型 ───────────────────────────────────────────────────────────
  // A─B (top)、E─F (crossbar)、C─D (bottom)、縦 2 本 A-E-C / B-F-D
  // Degrees: A=2, B=2, C=2, D=2, E=3*, F=3*  → Euler path E↔F
  // 辺が一直線上で重ならないため視覚的に判別しやすい
  {
    id: "h-shape",
    difficulty: "medium",
    nodes: [
      { id: "A", x: 80,  y: 80  },
      { id: "B", x: 320, y: 80  },
      { id: "C", x: 80,  y: 360 },
      { id: "D", x: 320, y: 360 },
      { id: "E", x: 80,  y: 220 },
      { id: "F", x: 320, y: 220 },
    ],
    edges: [
      { from: "A", to: "B" },   // top horizontal
      { from: "A", to: "E" },   // left upper vertical
      { from: "E", to: "C" },   // left lower vertical
      { from: "B", to: "F" },   // right upper vertical
      { from: "F", to: "D" },   // right lower vertical
      { from: "E", to: "F" },   // crossbar
      { from: "C", to: "D" },   // bottom horizontal
    ],
    oddNodes: ["E", "F"],
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
