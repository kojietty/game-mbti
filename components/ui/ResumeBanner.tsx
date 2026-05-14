"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "@/lib/store";
import { Link } from "@/i18n/navigation";

export function ResumeBanner() {
  const t = useTranslations("landing");
  const [mounted, setMounted] = useState(false);
  const { gameIndex, results, resetSession } = useStore();

  useEffect(() => setMounted(true), []);

  if (!mounted || results.length === 0 || gameIndex === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-[var(--color-surface)] border-b border-[var(--color-primary)] px-4 py-3 flex items-center justify-between gap-4 text-sm">
      <span className="text-[var(--color-muted)]">
        {t("resumeBanner", { completed: results.length })}
      </span>
      <div className="flex gap-3 shrink-0">
        <button
          onClick={resetSession}
          className="text-[var(--color-muted)] hover:text-white transition-colors"
        >
          {t("resumeRestart")}
        </button>
        <Link
          href="/play"
          className="text-[var(--color-primary)] font-bold hover:text-cyan-300 transition-colors"
        >
          {t("resumeContinue")}
        </Link>
      </div>
    </div>
  );
}
