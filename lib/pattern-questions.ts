export type Shape = "circle" | "square" | "triangle" | "diamond";
export type Color = "cyan" | "fuchsia" | "green" | "orange";
export type Size = "sm" | "md" | "lg";

export interface ShapeItem {
  shape: Shape;
  color: Color;
  size: Size;
}

export interface PatternQuestion {
  id: number;
  items: [ShapeItem, ShapeItem, ShapeItem, ShapeItem]; // 4 shown
  answer: ShapeItem;
  distractors: [ShapeItem, ShapeItem, ShapeItem]; // 3 wrong choices
}

const C: Color[] = ["cyan", "fuchsia", "green", "orange"];
const S: Shape[] = ["circle", "square", "triangle", "diamond"];
const Z: Size[] = ["sm", "md", "lg"];

export const QUESTIONS: PatternQuestion[] = [
  // Q1: Shape cycle cyan — circle sq tri dia → circle
  {
    id: 1,
    items: [
      { shape: "circle",   color: "cyan", size: "md" },
      { shape: "square",   color: "cyan", size: "md" },
      { shape: "triangle", color: "cyan", size: "md" },
      { shape: "diamond",  color: "cyan", size: "md" },
    ],
    answer: { shape: "circle", color: "cyan", size: "md" },
    distractors: [
      { shape: "square",   color: "cyan",    size: "md" },
      { shape: "triangle", color: "cyan",    size: "md" },
      { shape: "circle",   color: "fuchsia", size: "md" },
    ],
  },
  // Q2: Color cycle circle — cyan fuchsia green orange → cyan
  {
    id: 2,
    items: [
      { shape: "circle", color: "cyan",    size: "md" },
      { shape: "circle", color: "fuchsia", size: "md" },
      { shape: "circle", color: "green",   size: "md" },
      { shape: "circle", color: "orange",  size: "md" },
    ],
    answer: { shape: "circle", color: "cyan", size: "md" },
    distractors: [
      { shape: "circle", color: "fuchsia", size: "md" },
      { shape: "circle", color: "green",   size: "md" },
      { shape: "square", color: "cyan",    size: "md" },
    ],
  },
  // Q3: Size grow square fuchsia — sm sm md md → lg
  {
    id: 3,
    items: [
      { shape: "square", color: "fuchsia", size: "sm" },
      { shape: "square", color: "fuchsia", size: "sm" },
      { shape: "square", color: "fuchsia", size: "md" },
      { shape: "square", color: "fuchsia", size: "md" },
    ],
    answer: { shape: "square", color: "fuchsia", size: "lg" },
    distractors: [
      { shape: "square",   color: "fuchsia", size: "sm" },
      { shape: "square",   color: "fuchsia", size: "md" },
      { shape: "triangle", color: "fuchsia", size: "lg" },
    ],
  },
  // Q4: Alternating shape green — circle tri circle tri → circle
  {
    id: 4,
    items: [
      { shape: "circle",   color: "green", size: "md" },
      { shape: "triangle", color: "green", size: "md" },
      { shape: "circle",   color: "green", size: "md" },
      { shape: "triangle", color: "green", size: "md" },
    ],
    answer: { shape: "circle", color: "green", size: "md" },
    distractors: [
      { shape: "triangle", color: "green", size: "md" },
      { shape: "circle",   color: "cyan",  size: "md" },
      { shape: "diamond",  color: "green", size: "md" },
    ],
  },
  // Q5: Size shrink diamond orange — lg md lg md → sm
  {
    id: 5,
    items: [
      { shape: "diamond", color: "orange", size: "lg" },
      { shape: "diamond", color: "orange", size: "md" },
      { shape: "diamond", color: "orange", size: "lg" },
      { shape: "diamond", color: "orange", size: "md" },
    ],
    answer: { shape: "diamond", color: "orange", size: "sm" },
    distractors: [
      { shape: "diamond", color: "orange", size: "lg" },
      { shape: "diamond", color: "orange", size: "md" },
      { shape: "square",  color: "orange", size: "sm" },
    ],
  },
  // Q6: Color + shape — cyan circle, fuchsia square, green triangle, orange diamond → cyan circle
  {
    id: 6,
    items: [
      { shape: "circle",   color: "cyan",    size: "md" },
      { shape: "square",   color: "fuchsia", size: "md" },
      { shape: "triangle", color: "green",   size: "md" },
      { shape: "diamond",  color: "orange",  size: "md" },
    ],
    answer: { shape: "circle", color: "cyan", size: "md" },
    distractors: [
      { shape: "square",   color: "fuchsia", size: "md" },
      { shape: "circle",   color: "orange",  size: "md" },
      { shape: "circle",   color: "fuchsia", size: "md" },
    ],
  },
  // Q7: Size cycle sm md lg sm — → md
  {
    id: 7,
    items: [
      { shape: "circle", color: "cyan", size: "sm" },
      { shape: "circle", color: "cyan", size: "md" },
      { shape: "circle", color: "cyan", size: "lg" },
      { shape: "circle", color: "cyan", size: "sm" },
    ],
    answer: { shape: "circle", color: "cyan", size: "md" },
    distractors: [
      { shape: "circle", color: "cyan",    size: "sm" },
      { shape: "circle", color: "cyan",    size: "lg" },
      { shape: "circle", color: "fuchsia", size: "md" },
    ],
  },
  // Q8: Alternating color sq — cyan fuchsia cyan fuchsia → cyan
  {
    id: 8,
    items: [
      { shape: "square", color: "cyan",    size: "md" },
      { shape: "square", color: "fuchsia", size: "md" },
      { shape: "square", color: "cyan",    size: "md" },
      { shape: "square", color: "fuchsia", size: "md" },
    ],
    answer: { shape: "square", color: "cyan", size: "md" },
    distractors: [
      { shape: "square",   color: "fuchsia", size: "md" },
      { shape: "circle",   color: "cyan",    size: "md" },
      { shape: "triangle", color: "cyan",    size: "md" },
    ],
  },
  // Q9: Shape + color cycle — cyan-circle, fuchsia-square, cyan-circle, fuchsia-square → cyan-circle
  {
    id: 9,
    items: [
      { shape: "triangle", color: "green",  size: "sm" },
      { shape: "triangle", color: "green",  size: "md" },
      { shape: "triangle", color: "orange", size: "sm" },
      { shape: "triangle", color: "orange", size: "md" },
    ],
    answer: { shape: "triangle", color: "green", size: "lg" },
    distractors: [
      { shape: "triangle", color: "orange", size: "lg" },
      { shape: "triangle", color: "green",  size: "sm" },
      { shape: "square",   color: "green",  size: "lg" },
    ],
  },
  // Q10: 3-shape cycle diamond — di sq ci di → sq
  {
    id: 10,
    items: [
      { shape: "diamond", color: "fuchsia", size: "md" },
      { shape: "square",  color: "fuchsia", size: "md" },
      { shape: "circle",  color: "fuchsia", size: "md" },
      { shape: "diamond", color: "fuchsia", size: "md" },
    ],
    answer: { shape: "square", color: "fuchsia", size: "md" },
    distractors: [
      { shape: "diamond", color: "fuchsia", size: "md" },
      { shape: "circle",  color: "fuchsia", size: "md" },
      { shape: "square",  color: "cyan",    size: "md" },
    ],
  },
];

/** Shuffle the 4 choices and return with correct index. */
export function shuffleChoices(q: PatternQuestion): {
  choices: ShapeItem[];
  correctIndex: number;
} {
  const all = [q.answer, ...q.distractors];
  const shuffled = all.sort(() => Math.random() - 0.5);
  return {
    choices: shuffled,
    correctIndex: shuffled.findIndex(
      (c) =>
        c.shape === q.answer.shape &&
        c.color === q.answer.color &&
        c.size === q.answer.size
    ),
  };
}
