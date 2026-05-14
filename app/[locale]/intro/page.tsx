"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { GAME_META, GAME_ORDER } from "@/lib/game-config";

export default function IntroPage() {
  const t = useTranslations("intro");
  const { consented, setConsented } = useStore();
  const [localConsent, setLocalConsent] = useState(consented);

  const handleStart = () => {
    setConsented(localConsent);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 py-12 gap-8 text-center">
      <h1
        className="text-3xl sm:text-5xl font-black tracking-widest"
        style={{ fontFamily: "var(--font-orbitron, sans-serif)" }}
      >
        {t("title")}
      </h1>

      {/* Meta info */}
      <div className="flex flex-wrap justify-center gap-4 text-sm text-[var(--color-muted)]">
        <span>⏱ {t("duration")}</span>
        <span>🎮 {t("gamesCount")}</span>
      </div>

      {/* Game icon preview */}
      <div className="flex flex-wrap justify-center gap-3 max-w-xs">
        {GAME_ORDER.map((id, i) => (
          <div
            key={id}
            className="w-10 h-10 rounded-lg card flex items-center justify-center text-xs font-mono text-[var(--color-primary)]"
            title={id}
          >
            {GAME_META[id].stageNum}
          </div>
        ))}
      </div>

      {/* Consent toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none max-w-sm">
        <input
          type="checkbox"
          className="w-4 h-4 accent-[var(--color-primary)] cursor-pointer"
          checked={localConsent}
          onChange={(e) => setLocalConsent(e.target.checked)}
        />
        <span className="text-sm text-[var(--color-muted)]">
          {localConsent ? t("consent") : t("consentOff")}
        </span>
      </label>

      {/* Start */}
      <Link href="/play" onClick={handleStart}>
        <Button size="lg" className="min-w-48 tracking-[0.2em]">
          {t("start")}
        </Button>
      </Link>

      {/* Privacy link */}
      <Link
        href="/privacy"
        className="text-xs text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
      >
        {t("privacyLink")}
      </Link>
    </main>
  );
}
