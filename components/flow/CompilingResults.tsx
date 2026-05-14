"use client";

import { useEffect, useState } from "react";

interface Props {
  onDone: () => void;
}

const STEPS = [
  "Analyzing reaction patterns...",
  "Processing memory traces...",
  "Evaluating logic pathways...",
  "Mapping empathy signals...",
  "Compiling player profile...",
];

export function CompilingResults({ onDone }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step < STEPS.length - 1) {
      const id = setTimeout(() => setStep((s) => s + 1), 500);
      return () => clearTimeout(id);
    } else {
      const id = setTimeout(onDone, 600);
      return () => clearTimeout(id);
    }
  }, [step, onDone]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-6">
      {/* Spinner */}
      <div className="w-16 h-16 rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin" />

      <div className="text-center space-y-2">
        {STEPS.map((s, i) => (
          <p
            key={s}
            className={`text-sm transition-all duration-300 ${
              i < step
                ? "text-[var(--color-success)]"
                : i === step
                  ? "text-white"
                  : "text-[var(--color-border)]"
            }`}
          >
            {i < step ? "✓ " : i === step ? "▶ " : "  "}
            {s}
          </p>
        ))}
      </div>
    </div>
  );
}
