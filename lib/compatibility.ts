import type { TypeCode, AxisKey } from "./types";

const AXIS_ORDER: AxisKey[] = ["VS", "OD", "LH", "PI"];
const PAIRS: [string, string][] = [
  ["V", "S"],
  ["O", "D"],
  ["L", "H"],
  ["P", "I"],
];

function flipIndex(code: TypeCode, idx: number): TypeCode {
  const chars = code.split("");
  const [a, b] = PAIRS[idx];
  chars[idx] = chars[idx] === a ? b : a;
  return chars.join("") as TypeCode;
}

function flipAll(code: TypeCode): TypeCode {
  return code
    .split("")
    .map((c, i) => {
      const [a, b] = PAIRS[i];
      return c === a ? b : a;
    })
    .join("") as TypeCode;
}

export interface CompatResult {
  bestMatch: TypeCode; // 4 axes flipped — complementary opposite
  similar: TypeCode;   // 1 axis flipped — same energy, one key difference
}

// Priority order for "similar": VS → LH → PI → OD
const SIMILAR_PRIORITY = [0, 2, 3, 1]; // index into AXIS_ORDER

export function getCompat(code: TypeCode): CompatResult {
  return {
    bestMatch: flipAll(code),
    similar: flipIndex(code, SIMILAR_PRIORITY[0]),
  };
}

export { AXIS_ORDER };
